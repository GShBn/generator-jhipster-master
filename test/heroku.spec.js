/* global describe, context, before, beforeEach, after, it */

const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fse = require('fs-extra');
const sinon = require('sinon');
const constants = require('../generators/generator-constants');
const ChildProcess = require('child_process');

const expectedFiles = {
    monolith: [
        'Procfile',
        `${constants.SERVER_MAIN_RES_DIR}/config/bootstrap-heroku.yml`,
        `${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`
    ]
};

describe('JHipster Heroku Sub Generator', () => {
    const herokuAppName = 'jhipster-test';
    let stub;

    before(() => {
        stub = sinon.stub(ChildProcess, 'exec');
        stub.withArgs('heroku --version').yields(false);
        stub.withArgs('heroku plugins').yields(false, 'heroku-cli-deploy');
        stub.withArgs('git init').yields([false, '', '']);
    });

    describe('monolith application', () => {
        describe('with an unavailable app name', () => {
            const autogeneratedAppName = 'jhipster-new-name';
            beforeEach((done) => {
                stub.withArgs(`heroku create ${herokuAppName}`).yields(true, '', 'Name is already taken').returns({
                    stdout: {
                        on: () => {}
                    }
                });
                stub.withArgs('heroku create ').yields(false, `https://${autogeneratedAppName}.herokuapp.com`);
                stub.withArgs(`heroku git:remote --app ${autogeneratedAppName}`).yields(false, `https://${autogeneratedAppName}.herokuapp.com`);
                stub.withArgs(`heroku addons:create jawsdb:kitefin --as DATABASE --app ${autogeneratedAppName}`).yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/default'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'jar',
                        herokuForceName: 'No'
                    })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
                // stdoutStub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', `"herokuAppName": "${autogeneratedAppName}"`);
            });
        });

        describe('with Git deployment', () => {
            beforeEach((done) => {
                stub.withArgs(`heroku create ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(`heroku addons:create jawsdb:kitefin --as DATABASE --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs('git add .').yields(false, '', '');
                stub.withArgs('git commit -m "Deploy to Heroku" --allow-empty').yields(false, '', '');
                stub.withArgs(`heroku config:set NPM_CONFIG_PRODUCTION="false" MAVEN_CUSTOM_OPTS="-Pprod,heroku -DskipTests" --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(`heroku buildpacks:add -i 1 heroku/nodejs --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(`heroku buildpacks:add heroku/java --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs('git push heroku HEAD:master').yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/default'), dir);
                    })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'git'
                    })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', '"herokuDeployType": "git"');
            });
        });

        describe('in the US', () => {
            beforeEach((done) => {
                stub.withArgs(`heroku create ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(`heroku addons:create jawsdb:kitefin --as DATABASE --app ${herokuAppName}`).yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/default/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'jar'
                    })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', '"herokuDeployType": "jar"');
                assert.fileContent(`${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`, 'datasource:');
                assert.noFileContent(`${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`, 'mongodb:');
            });
        });

        describe('in the EU', () => {
            beforeEach((done) => {
                stub.withArgs(`heroku create ${herokuAppName} --region eu`).yields(false, '', '');
                stub.withArgs(`heroku addons:create jawsdb:kitefin --as DATABASE --app ${herokuAppName}`).yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/default/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'eu',
                        herokuDeployType: 'jar'
                    })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
            });
        });

        describe('with PostgreSQL', () => {
            beforeEach((done) => {
                stub.withArgs(`heroku create ${herokuAppName} --region eu`).yields(false, '', '');
                stub.withArgs(`heroku addons:create heroku-postgresql --as DATABASE --app ${herokuAppName}`).yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/default-psql/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'eu',
                        herokuDeployType: 'jar'
                    })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent(`${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`, 'datasource:');
                assert.noFileContent(`${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`, 'mongodb:');
            });
        });

        describe('with existing app', () => {
            const existingHerokuAppName = 'jhipster-existing';
            beforeEach((done) => {
                stub.withArgs('heroku apps:info --json').yields(false, `{"app":{"name":"${existingHerokuAppName}"}, "dynos":[]}`);
                stub.withArgs(`heroku addons:create jawsdb:kitefin --as DATABASE --app ${existingHerokuAppName}`).yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/heroku/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', `"herokuAppName": "${existingHerokuAppName}"`);
            });
        });

        describe('with elasticsearch', () => {
            beforeEach((done) => {
                stub.withArgs(`heroku create ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(`heroku addons:create jawsdb:kitefin --as DATABASE --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(`heroku addons:create searchbox:starter --as SEARCHBOX --app ${herokuAppName}`).yields(false, '', '');

                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir((dir) => {
                        fse.copySync(path.join(__dirname, './templates/default-elasticsearch/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'jar'
                    })
                    .on('end', done);
            });
            after(() => {
                stub.restore();
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', '"herokuDeployType": "jar"');
                assert.fileContent(`${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`, 'datasource:');
                assert.noFileContent(`${constants.SERVER_MAIN_RES_DIR}/config/application-heroku.yml`, 'mongodb:');
            });
        });
    });
});
