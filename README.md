# soap-graphql-demo

Demo application for [soap-graphql](https://github.com/sevenclev/node-soap-graphql).

Uses:
* [express-graphql](https://github.com/graphql/express-graphql) to serve the GraphQL schema as a webserver.
* [graphql-weaver](https://github.com/AEB-labs/graphql-weaver) to weave multiple SOAP endpoints into one GraphQL schema.

## Installation

```bash
npm install -g soap-graphql-demo
```

## Usage

### Example Server
```bash
soap-graphql-demo
```
Starts an example server for these openly available SOAP endpoints:
* http://www.webservicex.net/geoipservice.asmx?WSDL
* http://ws.cdyne.com/ip2geo/ip2geo.asmx?wsdl
* http://www.webservicex.net/globalweather.asmx?WSDL
* http://www.webservicex.net/periodictable.asmx?WSDL
* http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL
* http://www.dataaccess.com/webservicesserver/numberconversion.wso?WSDL
* http://www.webservicex.net/CurrencyConvertor.asmx?WSDL
* http://soatest.parasoft.com/calculator.wsdl
* http://www.webservicex.net/Astronomical.asmx?WSDL

### Serve a single SOAP endpoint
```bash
soap-graphql-demo <<url-to-wsdl>>
```
Starts a server for a single SOAP endpoint. `url-to-wsdl` can be either a web URL or a path to a local WSDL file.

Example:
```bash
soap-graphql-demo http://www.webservicex.net/isbn.asmx?WSDL
```

### Use a config file
```bash
soap-graphql-demo --config <<path-to-config-file>>
```

Starts a server based on the given config. `path-to-config-file` must be absolute or relative path to a config file.

Config file must look like this:
```json
{
    "port": 4001,
    "path": "/my-graphql",
    "endpoints": {
        "bible": "http://www.webservicex.net/BibleWebservice.asmx?WSDL",
        "braille": "http://www.webservicex.net/braille.asmx?WSDL"
    }
}
```

`port`: Port on which the server will be served, defaults to `4000`.

`path`: Path on which the GraphQL schema will be served, defaults to `/graphql`.

`endpoints`: List of SOAP endpoints.
