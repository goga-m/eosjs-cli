#!/usr/bin/env node
require('module-alias/register')

const cliFlow = require('./lib/flow')
cliFlow.start()
