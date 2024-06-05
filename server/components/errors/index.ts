export default {
  '404': pageNotFound,
}

function pageNotFound(req: any, res: any) {

  const viewFilePath = '404';
  const statusCode = 404;
  const result = {
    status: statusCode
  };

  res.status(result.status);
  res.render(viewFilePath, (err: any) => {
    if (err) { return res.json(result, result.status); }

    res.render(viewFilePath);
  });
}
