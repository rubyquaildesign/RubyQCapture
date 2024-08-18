#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';
import recordServer from '.';
const argv = process.argv;
const args = hideBin(argv);
const yarg = await yargs(args).parse();
const portNo = yarg._[0];
let port = typeof portNo === 'string' ? parseFloat(portNo) : portNo;
if (port < 1000 || port > 9999) port = 2469;
recordServer(port);
