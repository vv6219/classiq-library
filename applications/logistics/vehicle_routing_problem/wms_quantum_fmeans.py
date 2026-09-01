from __future__ import annotations

from dataclasses import dataclass
import time
from typing import Sequence

import numpy as np

from classiq import (
    H,
    QArray,
    QBit,
    SWAP,
    control,
    qfunc,
    RY,
)

from wms_quantum_optimization_pipeline import (
    OrderLocation,
    qubitized_feature_vector,
    build_vrp_qubo,
    qubo_to_ising_cost,
)


@qfunc
def quantum_swap_test_circuit(
    state_a: QArray,
    state_b: QArray,
    ancilla: QBit,
):
    """Swap-test circuit: evaluates the fidelity F = |<state_a|state_b>|^2.

    Applies Hadamard to ancilla, controlled-SWAP between register qubits, and
    Hadamard to ancilla. Measuring ancilla in computational basis yields:
        P(|0>) = (1 + |<state_a|state_b>|^2) / 2
        P(|1>) = (1 - |<state_a|state_b>|^2) / 2
    """
    H(ancilla)
    for i in range(len(state_a)):
        control(ancilla)(SWAP(state_a[i], state_b[i]))
    H(ancilla)


@qfunc
def encode_fuzzy_feature_state(
    feature_params: list[float],
    reg: QArray,
):
    """Amplitude / angle encoding of multi-criteria warehouse order features."""
    if len(feature_params) != len(reg):
        raise ValueError("Feature params length must match register length.")
    for idx, val in enumerate(feature_params):
        theta = 2.0 * np.arcsin(np.clip(np.sqrt(max(0.0, val)), 0.0, 1.0))
        RY(theta, reg[idx])


def quantum_fidelity_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Computes the quantum distance derived from Born's rule measurement probabilities.

    D_Q(a, b) = 1.0 - |<a|b>|^2 = 2 * P(|1>_ancilla)
    """
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if np.isclose(na, 0.0) or np.isclose(nb, 0.0):
        return 1.0
    a_norm = a / na
    b_norm = b / nb
    overlap = float(np.dot(a_norm, b_norm))
    fidelity = max(0.0, min(1.0, overlap**2))
    return float(np.clip(1.0 - fidelity, 0.0, 1.0))


class QuantumFMeans:
    """Quantum Fuzzy C-Means (QFCM / F-Means) Engine.

    Partitions orders into K clusters using continuous membership probabilities
    u_{ik} in [0, 1] derived from quantum fidelity distances.
    """

    def __init__(
        self,
        n_clusters: int = 3,
        m: float = 2.0,
        max_iter: int = 60,
        tol: float = 1e-5,
        random_state: int = 42,
    ):
        if n_clusters < 1:
            raise ValueError("n_clusters must be at least 1")
        if m <= 1.0:
            raise ValueError("Fuzziness parameter m must be strictly greater than 1.0")
        self.n_clusters = n_clusters
        self.m = m
        self.max_iter = max_iter
        self.tol = tol
        self.random_state = random_state

        self.centroids_: list[np.ndarray] = []
        self.membership_matrix_: np.ndarray | None = None
        self.feature_matrix_: np.ndarray | None = None
        self.entropies_: np.ndarray | None = None

    def fit(self, orders: Sequence[OrderLocation]) -> QuantumFMeans:
        n_samples = len(orders)
        if n_samples == 0:
            self.centroids_ = []
            self.membership_matrix_ = np.empty((0, self.n_clusters))
            self.entropies_ = np.empty(0)
            return self

        k = min(self.n_clusters, n_samples)
        x = np.vstack([qubitized_feature_vector(o) for o in orders])
        self.feature_matrix_ = x

        rng = np.random.default_rng(self.random_state)
        # Initialize membership matrix with Dirichlet distribution to ensure sum_k u_{ik} = 1
        U = rng.uniform(0.1, 1.0, size=(n_samples, k))
        U = U / np.sum(U, axis=1, keepdims=True)

        p = 2.0 / (self.m - 1.0)
        eps = 1e-9

        for iteration in range(self.max_iter):
            U_prev = U.copy()
            Um = U**self.m

            # 1. Update centroids using fuzzy weights
            centers = []
            for j in range(k):
                denominator = np.sum(Um[:, j])
                if denominator < eps:
                    center = x[rng.integers(0, n_samples)]
                else:
                    center = np.sum(Um[:, j : j + 1] * x, axis=0) / denominator
                c_norm = np.linalg.norm(center)
                if c_norm > eps:
                    center = center / c_norm
                centers.append(center)

            # 2. Compute quantum fidelity distance matrix D_{ik}
            D = np.zeros((n_samples, k), dtype=float)
            for i in range(n_samples):
                for j in range(k):
                    D[i, j] = quantum_fidelity_distance(x[i], centers[j])

            # 3. Update membership matrix U_{ik}
            new_U = np.zeros((n_samples, k), dtype=float)
            for i in range(n_samples):
                # Handle exact overlap distance zero cases
                zero_dist = np.where(D[i] < eps)[0]
                if len(zero_dist) > 0:
                    new_U[i, zero_dist] = 1.0 / len(zero_dist)
                else:
                    inv_dists = (1.0 / np.maximum(D[i], eps)) ** (1.0 / (self.m - 1.0))
                    new_U[i] = inv_dists / np.sum(inv_dists)

            U = new_U
            diff = np.max(np.abs(U - U_prev))
            if diff < self.tol:
                break

        self.centroids_ = centers
        self.membership_matrix_ = U

        # Compute Shannon entropy per sample: H_i = - sum_k u_ik * ln(u_ik)
        self.entropies_ = -np.sum(U * np.log(np.maximum(U, 1e-12)), axis=1)
        return self

    def predict_proba(self, orders: Sequence[OrderLocation]) -> np.ndarray:
        if self.membership_matrix_ is None or len(self.centroids_) == 0:
            raise RuntimeError("Model has not been fitted yet.")
        x = np.vstack([qubitized_feature_vector(o) for o in orders])
        n_samples = len(x)
        k = len(self.centroids_)
        eps = 1e-9

        D = np.zeros((n_samples, k), dtype=float)
        for i in range(n_samples):
            for j in range(k):
                D[i, j] = quantum_fidelity_distance(x[i], self.centroids_[j])

        proba = np.zeros((n_samples, k), dtype=float)
        for i in range(n_samples):
            zero_dist = np.where(D[i] < eps)[0]
            if len(zero_dist) > 0:
                proba[i, zero_dist] = 1.0 / len(zero_dist)
            else:
                inv_dists = (1.0 / np.maximum(D[i], eps)) ** (1.0 / (self.m - 1.0))
                proba[i] = inv_dists / np.sum(inv_dists)
        return proba

    def predict(self, orders: Sequence[OrderLocation] | None = None) -> list[int]:
        if orders is None:
            if self.membership_matrix_ is None:
                raise RuntimeError("Model has not been fitted yet.")
            return np.argmax(self.membership_matrix_, axis=1).tolist()
        proba = self.predict_proba(orders)
        return np.argmax(proba, axis=1).tolist()

    def get_cluster_entropy(self) -> np.ndarray:
        if self.entropies_ is None:
            raise RuntimeError("Model has not been fitted yet.")
        return self.entropies_


def entropy_rebalance_clusters(
    orders: list[OrderLocation],
    membership_matrix: np.ndarray,
    k_batches: int,
    vehicle_capacity: float,
    entropy_threshold: float = 0.45,
) -> list[int]:
    """Rebalances boundary orders with high fuzzy entropy across AGV capacity constraints.

    Orders with high membership entropy (i.e. situated on cluster borders) are dynamically
    routed to the least-loaded qualified AGV batch to avoid vehicle overload.
    """
    n = len(orders)
    if n == 0:
        return []

    # Initial crisp assignment
    crisp_labels = np.argmax(membership_matrix, axis=1)
    weights = np.array([o.weight for o in orders], dtype=float)

    # Calculate cluster loads
    cluster_loads = np.zeros(k_batches, dtype=float)
    for idx, c in enumerate(crisp_labels):
        cluster_loads[c] += weights[idx]

    # Calculate entropy per order
    entropies = -np.sum(membership_matrix * np.log(np.maximum(membership_matrix, 1e-12)), axis=1)

    # Sort high-entropy orders descending
    boundary_indices = np.where(entropies > entropy_threshold)[0]
    boundary_indices = boundary_indices[np.argsort(-entropies[boundary_indices])]

    rebalanced_labels = crisp_labels.copy()

    for idx in boundary_indices:
        current_cluster = rebalanced_labels[idx]
        w = weights[idx]

        # Check if current cluster is overloaded or significantly above average
        if cluster_loads[current_cluster] > vehicle_capacity * 0.85:
            # Find candidate clusters where order has significant membership (e.g. > 15%)
            probs = membership_matrix[idx]
            candidate_clusters = [c for c in range(k_batches) if probs[c] > 0.15 and c != current_cluster]
            if not candidate_clusters:
                continue

            # Pick least-loaded qualified candidate
            best_candidate = min(candidate_clusters, key=lambda c: cluster_loads[c])
            if cluster_loads[best_candidate] + w < cluster_loads[current_cluster]:
                cluster_loads[current_cluster] -= w
                cluster_loads[best_candidate] += w
                rebalanced_labels[idx] = best_candidate

    return rebalanced_labels.tolist()


def fuzzy_route_cluster_pipeline(
    order_locations: list[OrderLocation],
    k_batches: int,
    vehicle_capacity: float = 120.0,
    qaoa_layers: int = 3,
    max_cluster_for_qubo: int | None = 14,
    m: float = 2.0,
    rebalance_entropy: bool = True,
) -> dict:
    """Complete Quantum Fuzzy C-Means (QFCM) optimization pipeline for WMS VRP."""
    qfcm = QuantumFMeans(n_clusters=k_batches, m=m, max_iter=60)
    qfcm.fit(order_locations)

    memberships = qfcm.membership_matrix_
    if memberships is None or len(memberships) == 0:
        return {
            "centers": [],
            "cluster_labels": [],
            "memberships": np.empty((0, k_batches)),
            "entropies": np.empty(0),
            "route_blocks": [],
            "qaoa_layers": qaoa_layers,
            "clustering_type": "quantum_fmeans",
        }

    if rebalance_entropy:
        cluster_labels = entropy_rebalance_clusters(
            order_locations, memberships, k_batches, vehicle_capacity
        )
    else:
        cluster_labels = qfcm.predict()

    features = np.vstack([qubitized_feature_vector(order) for order in order_locations])
    route_blocks = []

    for cluster_id in range(k_batches):
        members = [idx for idx, label in enumerate(cluster_labels) if label == cluster_id]
        if not members:
            continue
        if max_cluster_for_qubo is not None and len(members) > max_cluster_for_qubo:
            route_blocks.append({
                "cluster": cluster_id,
                "h": np.zeros(0),
                "J": np.zeros((0, 0)),
                "qubo": np.zeros((0, 0)),
                "skipped_qubo": True,
            })
            continue

        cluster_features = features[members]
        dist = np.zeros((len(members), len(members)))
        for i in range(len(members)):
            for j in range(len(members)):
                dist[i, j] = quantum_fidelity_distance(cluster_features[i], cluster_features[j])

        weights = np.asarray([order_locations[idx].weight for idx in members], dtype=float)
        qubo = build_vrp_qubo(dist, weights, vehicle_capacity)
        h, J = qubo_to_ising_cost(qubo)
        route_blocks.append({
            "cluster": cluster_id,
            "h": h,
            "J": J,
            "qubo": qubo,
            "skipped_qubo": False,
        })

    return {
        "centers": qfcm.centroids_,
        "cluster_labels": cluster_labels,
        "memberships": memberships,
        "entropies": qfcm.get_cluster_entropy(),
        "route_blocks": route_blocks,
        "qaoa_layers": qaoa_layers,
        "clustering_type": "quantum_fmeans",
    }
