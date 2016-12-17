const _ = require('lodash');

export {agentBuild, agentName};

function agentBuild(req) {

  let match = userAgent(req).match(/^[^/]*\/([^ ]+)/);

  return _.get(req, 'query.agentBuild')
    || parseInt(match ? match[1] : 0)
    || 0;
}

function agentName(req) {

  let match = userAgent(req).match(/^[^/]*\/([^ ]+)/);

  return _.get(req, 'query.agentName')
    || match[0]
    || null;
}

function userAgent(req) {
  return _.get(req, 'headers.user-agent')
    || _.get(req, 'userAgent')
    || '';
}
