import * as postmark from "../../src/index";

import {expect} from "chai";
import "mocha";

import {SuppressionOrigin, SuppressionReason, Suppressions, SuppressionStatuses} from "../../src/client/models";
import * as dotenv from "dotenv";

dotenv.config();

describe("Client - Suppressions", () => {
    const serverToken: any = process.env.SERVER_API_TOKEN;
    const client = new postmark.ServerClient(serverToken);
    const suppression_email_domain:string = 'supression.example.com';

    async function cleanup() {
        const suppressions: Suppressions = await client.getSuppressions('outbound');
        for (const suppression of suppressions.Suppressions) {
            if (suppression.EmailAddress.includes(suppression_email_domain)) {
                await client.deleteSuppressions('outbound', { Suppressions: [ { EmailAddress: suppression.EmailAddress} ] });
            }
        }
    }

    before(cleanup);
    after(cleanup);

    it("createSuppression", async () => {
        const emailAddress = `nothing+create@${suppression_email_domain}`;
        const suppression: SuppressionStatuses = await client.createSuppressions('outbound', {
            Suppressions: [ { EmailAddress: emailAddress} ]
        });

        expect(suppression.Suppressions.length).to.eq(1);
    });

    it("getSuppressions", async () => {
        const emailAddress = `nothing+list@${suppression_email_domain}`;
        await client.createSuppressions('outbound', {
            Suppressions: [ { EmailAddress: emailAddress} ]
        });

        const suppressions: Suppressions = await client.getSuppressions('outbound');
        expect(suppressions.Suppressions.length).to.be.gte(1);
    });

    it("getSuppressions - filter", async () => {
        const email = `nothing+list@${suppression_email_domain}`;
        await client.createSuppressions('outbound', {
            Suppressions: [ { EmailAddress: email} ]
        });

        let suppressions = await client.getSuppressions('outbound', {
            emailAddress: email,
            origin: SuppressionOrigin.Customer,
            suppressionReason: SuppressionReason.ManualSuppression
        });
        expect(suppressions.Suppressions.length).to.eq(1);

        suppressions = await client.getSuppressions('outbound', {emailAddress: "invalid"});
        expect(suppressions.Suppressions.length).to.be.eq(0);

        suppressions = await client.getSuppressions('outbound', {emailAddress: email, origin: SuppressionOrigin.Admin});
        expect(suppressions.Suppressions.length).to.eq(0);
    });

    it("deleteSuppression", async () => {
        const emailAddress = `nothing+delete@${suppression_email_domain}`;
        const suppression: SuppressionStatuses = await client.deleteSuppressions('outbound', {
            Suppressions: [ { EmailAddress: emailAddress} ]
        });

        expect(suppression.Suppressions.length).to.eq(1);
    });
});
