'use strict';

const test = require('ava');
const store = require('./fixtures/store');
const supertest = require('supertest');
const logger = require('../../../lib/logger');
const getApp = require('../../../lib/app');

const { EventEmitter } = require('events');
const eventBus = new EventEmitter();

test.beforeEach(() =>  {
    logger.setLevel('FATAL');
});

function getSetup () {
    const base = `/random${Math.round(Math.random() * 1000)}`;
    const stores = store.createStores();
    const app = getApp({
        baseUriPath: base,
        stores,
        eventBus,
    });

    return {
        base,
        featureToggleStore: stores.featureToggleStore,
        request: supertest(app),
    };
}

test('should get empty getFeatures', t => {
    const { request, base } = getSetup();
    return request
        .get(`${base}/features`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            t.true(res.body.features.length === 0);
        });
});

test('should get one getFeature', t => {
    const { request, featureToggleStore, base } = getSetup();
    featureToggleStore.addFeature({ name: 'test_', strategies: [{ name: 'default_' }] });

    return request
        .get(`${base}/features`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            t.true(res.body.features.length === 1);
        });
});

test('should add version numbers for /features', t => {
    const { request, featureToggleStore, base } = getSetup();
    featureToggleStore.addFeature({ name: 'test2', strategies: [{ name: 'default' }] });

    return request
        .get(`${base}/features`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            t.true(res.body.version === 1);
        });
});

test('should require at least one strategy when creating a feature toggle', t => {
    const { request, base } = getSetup();

    return request
        .post(`${base}/features`)
        .send({ name: 'sample.missing.strategy' })
        .set('Content-Type', 'application/json')
        .expect(400)
});

test('should require at least one strategy when updating a feature toggle', t => {
    const { request, featureToggleStore, base } = getSetup();
    featureToggleStore.addFeature({ name: 'ts', strategies: [{ name: 'default' }] });

    return request
        .put(`${base}/features/ts`)
        .send({ name: 'ts' })
        .set('Content-Type', 'application/json')
        .expect(400)
});
