import * as jsDataModel from './jsData.model';


export function indexBy(req: any, res: any, next: any) {

  let resource = `${req.params.pool}/${req.params.parentResource}/${req.params.parentId}/${req.params.resource}`;
  let params = req.query;
  let options = {
    headers: req.headers
  };

  jsDataModel.findAll(resource, params, options)
    .then(handleFindAllResponse(res))
    .catch(handleError(res, next))
  ;

}

export function index(req: any, res: any, next: any) {

  const resource = req.params.pool + '/' + req.params.resource;
  const params = req.query;
  const options = {
    headers: req.headers
  };

  jsDataModel.findAll(resource, params, options)
    .then(handleFindAllResponse(res))
    .catch(handleError(res, next))
  ;

}

export function show(req: any, res: any, next: any) {

  const resource = req.params.pool + '/' + req.params.resource;
  const { id } = req.params;
  const options = {
    headers: req.headers
  };

  jsDataModel.find(resource, id, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

export function create(req: any, res: any, next: any) {

  const resource = `${req.params.pool}/${req.params.resource}`;
  const attrs = req.body;
  const options = {
    headers: req.headers,
    qs: req.query
  };

  jsDataModel.create(resource, attrs, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

}

export function update(req: any, res: any, next: any) {

  const resource = `${req.params.pool}/${req.params.resource}`;
  const { id } = req.params;
  const attrs = req.body;
  const options = {
    headers: req.headers,
    qs: req.query
  };

  jsDataModel.update(resource, id, attrs, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

}

export function destroy(req: any, res: any, next: any) {

  const resource = `${req.params.pool}/${req.params.resource}`;
  const { id } = req.params;
  const options = {
    headers: req.headers,
    qs: req.query
  };

  jsDataModel.destroy(resource, id, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

}

function handleResponse(response: any) {
  return (data: any) => {
    response.json(data);
  };
}

function handleFindAllResponse(response: any) {
  return (res: any) => {
    const offset = res && res.xOffset;
    if (offset) {
      response.set('X-Offset', offset);
    }
    response.json(res.data);
  };
}

function handleError(response: any, next: any) {
  return (errObj: any) => {

    let err = errObj && errObj.status || errObj;

    if (err === 401) {
      return response.status(401).end();
    }

    if (err === 404) {
      return response.status(404).end();
    }

    if (err && err.response && err.response.status === 500) {
      return response.status(500).end(err.error);
    }

    next(err);
  }
}
