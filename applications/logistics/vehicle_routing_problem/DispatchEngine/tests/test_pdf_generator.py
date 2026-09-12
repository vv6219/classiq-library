"""Unit tests for WavePDFReportGenerator across all 4 profiles."""

import unittest
from DispatchEngine.presentation.pdf_generator import WavePDFReportGenerator


class TestPDFGenerator(unittest.TestCase):
    def setUp(self):
        self.sample_run = {
            "run_id": "RUN-TEST-001",
            "wave_id": "WAVE-20260912-001",
            "operational_mode": "QUANTUM",
            "total_makespan_sec": 949.3,
            "total_distance_km": 3.706,
            "chute_variance": 0.45,
            "falsification_ratio_phi": 0.880,
            "verification_code": "lmn",
            "timestamp": "2026-09-12 00:00:00 UTC",
        }

    def test_executive_report(self):
        pdf_bytes = WavePDFReportGenerator.generate_report(self.sample_run, profile="EXECUTIVE")
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 15000)

    def test_comprehensive_report(self):
        pdf_bytes = WavePDFReportGenerator.generate_report(self.sample_run, profile="COMPREHENSIVE")
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 50000)

    def test_quantum_report(self):
        pdf_bytes = WavePDFReportGenerator.generate_report(self.sample_run, profile="QUANTUM")
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 25000)

    def test_certificate_report(self):
        pdf_bytes = WavePDFReportGenerator.generate_report(self.sample_run, profile="CERTIFICATE")
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 15000)


if __name__ == "__main__":
    unittest.main()
