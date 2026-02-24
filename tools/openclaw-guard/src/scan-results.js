/**
 * ScanResults - Aggregates and formats findings from all scanners
 */

class ScanResults {
  constructor(opts = {}) {
    this.empty = opts.empty || false;
    this.findings = {};
    this.timestamp = new Date().toISOString();
  }

  addFindings(scannerName, findings) {
    this.findings[scannerName] = findings || [];
  }

  hasIssues() {
    return Object.values(this.findings).some(f => f.length > 0);
  }

  hasErrors() {
    // Check for any ERROR severity finding
    for (const [name, findings] of Object.entries(this.findings)) {
      if (findings.some(f => f.severity === 'ERROR')) {
        return true;
      }
    }
    return false;
  }

  getSummary() {
    let total = 0;
    let errors = 0;
    let warnings = 0;

    for (const findings of Object.values(this.findings)) {
      total += findings.length;
      errors += findings.filter(f => f.severity === 'ERROR').length;
      warnings += findings.filter(f => f.severity === 'WARN').length;
    }

    return { total, errors, warnings };
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      empty: this.empty,
      summary: this.getSummary(),
      findings: this.findings
    };
  }
}

module.exports = { ScanResults };
