import * as express from 'express';
import * as expressGraphql from 'express-graphql';
import { GraphQLSchema, GraphQLInputType, GraphQLEnumValueConfigMap, GraphQLEnumType } from 'graphql';
import { weaveSchemas, EndpointConfig } from 'graphql-weaver';
import { soapGraphqlSchema, NodeSoapOptions, DefaultTypeResolver, SoapGraphqlOptions, SoapCallInput, NodeSoapClient, createLogger, createSoapClient } from 'soap-graphql';
import { NodeSoapCaller } from 'soap-graphql/dist/src/node-soap/node-soap-caller';
import { SoapCaller } from 'soap-graphql/dist/src/soap2graphql/soap-caller';
import { Server } from 'http';

type Endpoint = string | SoapGraphqlOptions;

export async function exampleSoapGraphqlServer(): Promise<Server> {

    const endpoints: { [key: string]: Endpoint } = {
        'geoipservice': 'http://www.webservicex.net/geoipservice.asmx?WSDL',
        'ip2geo': 'http://ws.cdyne.com/ip2geo/ip2geo.asmx?wsdl',
        'globalweather': 'http://www.webservicex.net/globalweather.asmx?WSDL',
        'periodictable': 'http://www.webservicex.net/periodictable.asmx?WSDL',
        'countryinfo': 'http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL',
        'numberconversion': 'http://www.dataaccess.com/webservicesserver/numberconversion.wso?WSDL',
        'currency': currencyEndpoint(),
        'calculator': await calculatorEndpoint(),
        'astronomical': astronomicalEndpoint(),
    };

    const config: EndpointConfig[] = (await Promise.all(
        Object.keys(endpoints).map(async (name: string) => {
            try {
                const endpoint: Endpoint = endpoints[name];
                const schema: GraphQLSchema = await soapGraphqlSchema(endpoint);
                console.log(`-> adding SOAP endpoint from '${typeof endpoint === 'string' ? endpoint : endpoint.createClient.url}'`);
                return {
                    namespace: name,
                    typePrefix: name,
                    schema: schema,
                };
            } catch (err) {
                // well, this endpoint seems to be not working anymore, just ignore it
                // console.error(err);
                return null;
            }
        }))).filter(config => !!config);

    const schema: GraphQLSchema = await weaveSchemas({ endpoints: config });

    const app: express.Application = express();
    app.use('/graphql', expressGraphql({
        schema: schema,
        graphiql: true,
    }));

    return app.listen(4000, () => { console.log(`serving GraphQL on http://localhost:4000/graphql`) });
}

function currencyEndpoint(): SoapGraphqlOptions {

    class CurrencyResolver extends DefaultTypeResolver {

        inputType(typeName: string): GraphQLInputType {
            if (!!typeName && typeName.startsWith('string|AFA,ALL,DZD,ARS,AWG,AUD,BSD,BHD,BDT,BBD')) {
                const values: GraphQLEnumValueConfigMap = {};
                typeName.substring(7).split(',').forEach((currencyCode: string) => {
                    values[currencyCode] = {};
                })

                return new GraphQLEnumType({
                    name: 'Currency',
                    values: values
                })
            }
            return super.inputType(typeName);
        }

    }

    return {
        createClient: { url: 'http://www.webservicex.net/CurrencyConvertor.asmx?WSDL' },
        schemaOptions: { customResolver: new CurrencyResolver() }
    }
}

async function calculatorEndpoint(): Promise<SoapGraphqlOptions> {

    class CalculatorCaller extends NodeSoapCaller {
        async createGraphqlResult(input: SoapCallInput, result: any): Promise<any> {
            return result['Result']['$value'];
        }
    }

    const soapClient: NodeSoapClient = await createSoapClient('http://soatest.parasoft.com/calculator.wsdl');
    const caller: SoapCaller = new CalculatorCaller(soapClient, createLogger(false, false));
    return {
        soapClient: soapClient,
        createClient: { url: 'http://soatest.parasoft.com/calculator.wsdl' },
        soapCaller: caller,
        debug: false,
    };
}

function astronomicalEndpoint(): SoapGraphqlOptions {

    class AstronomicalResolver extends DefaultTypeResolver {

        inputType(typeName: string): GraphQLInputType {
            if (typeName === 'string|meters,kilometers,miles,AstronmicalunitAU,lightyear,parsec') {
                return new GraphQLEnumType({
                    name: 'AstronomicalUnit',
                    values: {
                        'meters': {},
                        'kilometers': {},
                        'miles': {},
                        'AstronmicalunitAU': {},
                        'lightyear': {},
                        'parsec': {},
                    }
                })
            }
            return super.inputType(typeName);
        }

    }

    return {
        createClient: { url: 'http://www.webservicex.net/Astronomical.asmx?WSDL' },
        schemaOptions: { customResolver: new AstronomicalResolver() }
    };
}
