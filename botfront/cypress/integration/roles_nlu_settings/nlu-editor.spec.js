/* eslint-disable no-undef */

const email = 'nlueditor@test.ia';

describe('nlu-editor role permissions', function() {
    before(function() {
        cy.fixture('bf_project_id.txt').as('bf_project_id');
        cy.fixture('bf_model_id.txt').as('bf_model_id');
        cy.login();
        cy.get('@bf_project_id').then((id) => {
            cy.createUser('nlu-editor', email, ['nlu-editor'], id);
        });
        cy.logout();
    });

    beforeEach(function() {
        cy.loginTestUser(email);
    });

    after(function() {
        cy.deleteUser(email);
    });

    it('should be able to change nlu model general settings and pipeline', function() {
        cy.visit(`/project/${this.bf_project_id}/nlu/models`);
        cy.get('[data-cy=settings-in-model]').click();
        cy.get('[data-cy=save-button]').click();
        cy.get('[data-cy=changes-saved]');
        cy.contains('Pipeline').click();
        cy.get('form').within(() => {
            cy.get('#config').parent().should('not.have.class', 'disabled');
            cy.get('[data-cy=save-button]').should('not.be.disabled');
            cy.get('[data-cy=save-button]').click();
            cy.get('[data-cy=changes-saved]');
        });
    });

    // TODO add test to check project settings are unavailable

    it('should not be able to call nlu.update', function() {
        cy.MeteorCall('nlu.update', [
            this.bf_model_id,
            {
                name: 'New Test Model',
                language: 'en',
            },
        ]).then(err => expect(err.error).to.equal('403'));
    });

    it('should be able to call nlu.update.general', function() {
        cy.MeteorCall('nlu.update.general', [
            this.bf_model_id,
            {
                config:
                    'pipeline:  - name: components.botfront.language_setter.LanguageSetter  - name: tokenizer_whitespace  - name: intent_featurizer_count_vectors'
                    + '  - name: intent_classifier_tensorflow_embedding  - BILOU_flag: true    name: ner_crf    features:      - [low, title, upper]'
                    + '      - [low, bias, prefix5, prefix2, suffix5, suffix3, suffix2, upper, title, digit, pattern]'
                    + '      - [low, title, upper]  - name: components.botfront.fuzzy_gazette.FuzzyGazette  - name: ner_synonyms',
            },
        ]).then(res => expect(res).to.equal(this.bf_model_id));
    });

    it('should show the train model button', function() {
        cy.visit(`/project/${this.bf_project_id}/nlu/model/${this.bf_model_id}`);
        cy.get('[data-cy=train-button]').click();
    });

    it('should be able to call nlu.train with out having a 403', function() {
        cy.MeteorCall('nlu.train', [
            this.bf_model_id,
            this.bf_project_id,
            { test: 1 },
        ]).then(err => expect(err.error).to.not.equal('403'));
    });
});