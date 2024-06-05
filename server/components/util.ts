import _ from 'lodash';

export function agentBuild(req: any) {

  let match = userAgent(req).match(/^[^/]*\/([^ ]+)/);

  return _.get(req, 'query.agentBuild') ||
    parseInt(match ? match[1] : 0) ||
    0;
}

export function agentName(req: any) {
  const [match] = userAgent(req).match(/^[^/]*/);
  return match || null;
}

function userAgent(req: any) {
  return _.get(req, 'headers.user-agent') ||
    _.get(req, 'userAgent') ||
    '';
}
