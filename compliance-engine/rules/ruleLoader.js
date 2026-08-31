/**
 * Rule Loader & Configurator Module
 * Data-driven rule dataset loader allowing dynamic rule filtering & configuration.
 */

const rulesData = require('./rules.json');

function loadRules(customConfig = {}) {
  let activeRules = [...rulesData];

  if (customConfig.disabledRules && Array.isArray(customConfig.disabledRules)) {
    activeRules = activeRules.filter(r => !customConfig.disabledRules.includes(r.rule_id));
  }

  if (customConfig.severityOverrides && typeof customConfig.severityOverrides === 'object') {
    activeRules = activeRules.map(r => {
      if (customConfig.severityOverrides[r.rule_id]) {
        return { ...r, severity: customConfig.severityOverrides[r.rule_id] };
      }
      return r;
    });
  }

  return activeRules;
}

module.exports = {
  loadRules,
  allRules: rulesData
};
