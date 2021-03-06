import uuidv4 from 'uuid/v4';

export default (e) => {
    const event = Object.assign({}, e);
    // event.body is not parse by API Gateway so we need
    // to parse it (can be but we are not doing it)
    // do not parse if its base64Encoded
    if (typeof event.body === 'string' && !event.isBase64Encoded) {
        try {
            event.body = JSON.parse(event.body);
        } catch (error) {
            event.body = null;
        }
    }
    // url params are not decoded automatically by the lambda-proxy integration
    if (event.pathParameters) {
        Object.keys(event.pathParameters).forEach((param) => {
            event.pathParameters[param] = decodeURIComponent(event.pathParameters[param]);
        });
    }
    if (event && event.requestContext && !event.requestContext.requestId) {
        event.requestContext.requestId = uuidv4();
    }
    return event;
};
