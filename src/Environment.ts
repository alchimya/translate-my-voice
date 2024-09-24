export class Environment {
    readonly region: string;
    readonly identityPoolId: string;

    constructor() {
        const region = process.env.REACT_APP_REGION;
        const identityPoolId = process.env.REACT_APP_IDENTITY_POOL_ID;

        if (!region || !identityPoolId) {
            throw new Error('Missing necessary environment variables: region or identityPoolId');
        }

        this.region = region;
        this.identityPoolId = identityPoolId;
    }
}


