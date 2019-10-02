import { expect } from 'chai';
import Joi from 'joi';

import * as lambdaUtils from '../src';
import lambdaResponse from '../src/lambda-wrapper/lambda-response';
import awsEvent from './awsEvent.json';
import awsEventBodyObject from './awsEventBodyObject.json';

const {
    db,
    ApiError,
    lambdaWrapper,
    utils,
    log,
} = lambdaUtils;

describe('DB', () => {
    it('should get getSqlConnection function', () => {
        expect(db.getSqlConnection).to.be.a('function');
    });

    it('should get closeSqlConnection function', () => {
        expect(db.closeSqlConnection).to.be.a('function');
    });
});

describe('ApiError', () => {
    it('should throw an APIError', () => {
        try {
            throw new ApiError('TestError', {});
        } catch (e) {
            expect(e.type).to.be.eql('TestError');
            expect(e).to.be.instanceOf(ApiError);
        }
    });
});

describe('Lambda Wrapper', () => {
    it('should get lambdaWrapper function', () => {
        expect(lambdaWrapper).to.be.a('function');
    });
});

describe('Log', () => {
    it('should not log if not initialized', () => {
        try {
            log.debug('test', 'index', { message: 'test' });
        } catch (e) {
            expect(e).to.be.instanceof(Error);
        }
    });

    it('should log to debug', () => {
        log.initLogger(
            {},
            log.LOG_TYPES.GENERAL,
            log.LOG_LEVELS.DEBUG,
        );
        log.debug('test', 'index', { message: 'test' });
    });

    it('should log to debug with aws event info (body string)', () => {
        log.initLogger(
            awsEvent,
            log.LOG_TYPES.GENERAL,
            log.LOG_LEVELS.DEBUG,
        );
        log.debug('test', 'index', { message: 'test' });
    });

    it('should log to debug with aws event info (body object)', () => {
        log.initLogger(
            awsEventBodyObject,
            log.LOG_TYPES.GENERAL,
            log.LOG_LEVELS.DEBUG,
        );
        log.debug('test', 'index', { message: 'test' });
    });
});

describe('Lambda Wrapper', () => {
    it('should return validation error', async () => {
        const schema = Joi.object().keys({
            response: Joi.object()
                .required(),
        }).required();
        const request = {
        };
        const response = await lambdaResponse(Promise.resolve()
            .then(() => utils.validateEvent(request, schema)));
        expect(response).to.have.haveOwnProperty('statusCode');
        expect(response.statusCode).to.be.equal(400);
    });

    it('should return empty body', async () => {
        const response = await lambdaResponse(Promise.resolve({
            statusCode: 200,
            headers: {
                Location: 'www',
            },
            body: '',
        }));
        expect(response).to.have.haveOwnProperty('statusCode');
        expect(response.statusCode).to.be.equal(200);
        expect(response.body).to.be.eql('');
    });
});

describe('Utils', () => {
    it('should get validate user', async () => {
        const id = await utils.validateUser('1', '1');
        expect(id).to.be.equal('1');
    });

    it('should throw error', async () => {
        try {
            await utils.validateUser('1', '2');
        } catch (e) {
            expect(e.type).to.be.equal('FORBIDDEN');
        }
    });

    it('should get validate event', async () => {
        const schema = Joi.object().keys({
            response: Joi.object()
                .required(),
        }).required();
        const request = {
            response: {
                test: '1',
            },
        };
        const object = await utils.validateEvent(request, schema);
        expect(object.response.test).to.be.equal(request.response.test);
    });

    it('should throw error', async () => {
        const schema = Joi.object().keys({
            response: Joi.object()
                .required(),
        }).required();
        const request = {
        };
        try {
            await utils.validateEvent(request, schema);
        } catch (e) {
            expect(e.name).to.be.equal('ValidationError');
        }
    });
});

