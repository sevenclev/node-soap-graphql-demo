import * as express from 'express';
import * as expressGraphql from 'express-graphql';
import { GraphQLSchema } from 'graphql';
import { SoapGraphqlOptions, soapGraphqlSchema } from 'soap-graphql';
import { Server } from 'https';
import { weaveSchemas } from 'graphql-weaver';

export type ExpressOptions = { port: number; path: string };
export type EndpointsOptions = { endpoints: { [endpoint: string]: SoapGraphqlOptions } };
export type SoapGraphQlServerOptions =
    SoapGraphqlOptions & ExpressOptions
    | EndpointsOptions & ExpressOptions
    | string;

export async function soapGraphQlServer(options: SoapGraphQlServerOptions): Promise<Server> {
    const schema: GraphQLSchema = await createSchema(options);
    const port: number = options['port'] || 4000;
    const path: string = options['path'] || '/graphql';
    return await startExpressServer(schema, port, path);
}

async function createSchema(options: SoapGraphQlServerOptions): Promise<GraphQLSchema> {
    if (typeof options === 'string' || isSoapGraphQlOptions(options)) {
        return soapGraphqlSchema(options);

    } else if (options.hasOwnProperty('endpoints')) {
        return await weaveEndpoints(<EndpointsOptions>options);

    } else {
        throw new Error(`unknown options ${options}`);
    }
}

function isSoapGraphQlOptions(options: any): boolean {
    return !!options && (options.hasOwnProperty('createClient') || options.hasOwnProperty('soapClient'));
}

async function weaveEndpoints(opts: EndpointsOptions): Promise<GraphQLSchema> {
    type EndpointOptions = { name: string; options: SoapGraphqlOptions; };
    const endpointOptions: EndpointOptions[] = Object.keys(opts.endpoints).map((key: string) => {
        return {
            name: key,
            options: opts.endpoints[key],
        };
    });

    type Endpoint = { name: string; schema: GraphQLSchema; }
    const endpoints: Endpoint[] = await Promise.all(endpointOptions.map(async (endpointOption: EndpointOptions) => {
        return {
            name: endpointOption.name,
            schema: await soapGraphqlSchema(endpointOption.options),
        };
    }));

    return await weaveSchemas({
        endpoints: endpoints.map((endpoint: Endpoint) => {
            return {
                namespace: endpoint.name,
                typePrefix: endpoint.name,
                schema: endpoint.schema,
            };
        }),
    });
}

function startExpressServer(schema: GraphQLSchema, port: number, path: string): Promise<Server> {

    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    const app: express.Application = express();
    app.use(path, expressGraphql({
        schema: schema,
        graphiql: true,
    }));

    return new Promise<Server>((resolve, reject) => {
        const server: Server = app.listen(port, () => {
            console.log(`serving GraphQL on http://localhost:${port}${path}`);
            resolve(server)
        }).on('error', (err) => reject(err));
    })
}
