#!/usr/bin/env node
import { readFileSync } from "fs";
import { soapGraphQlServer } from "./index";
import { exampleSoapGraphqlServer } from "./example";

function printUsage(): void {
    console.log(`
Usage:
    soap-graphql-server: Start an example server with a variety of openly available SOAP endpoints.
    soap-graphql-server <<url-or-file-path-to-wsdl>>: Start a server that publishes the SOAP endpoint defined by the given URL or file path to a WSDL.
    soap-graphql-server --config <<path-to-config>>: Start a server based on the given config file.
    `);
}

async function startExample(): Promise<void> {
    console.log(`start example server`);
    try {
        await exampleSoapGraphqlServer();
    } catch (err) {
        console.error(`could not start example server.`);
        throw err;
    }
}

async function startFromUrl(urlOrFilepath: string): Promise<void> {
    console.log(`start server from URL or WSDL file '${urlOrFilepath}'`);
    try {
        await soapGraphQlServer(urlOrFilepath);
    } catch (err) {
        console.error(`could not start server from '${urlOrFilepath}'.`);
        throw err;
    }
}

async function startFromConfig(filepath: string): Promise<void> {
    try {
        console.log(`start server from config in '${filepath}'`);
        const buf: Buffer = readFileSync(filepath);
        await soapGraphQlServer(JSON.parse(buf.toString()));
    } catch (err) {
        console.error(`could not start server from config in '${filepath}'.`);
        throw err;
    }
}

async function start(args: string[]): Promise<void> {

    if (args.length == 0) {
        await startExample();

    } else if (args.length == 1) {
        await startFromUrl(args[0]);

    } else if (args.length == 2) {
        // args[0] should be "--config" ... but since there are no other possible usages: lets just ignore that
        await startFromConfig(args[1]);

    } else {
        printUsage();
    }
}

start(process.argv.slice(2)).catch(err => console.error(err));
