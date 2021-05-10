/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Gulp script to build Blockly for Node & NPM.
 * Run this script by calling "npm install" in this directory.
 */

const gulp = require("gulp");

const typings = require("./scripts/gulpfiles/typings");
const buildTasks = require("./scripts/gulpfiles/build_tasks");
const packageTasks = require("./scripts/gulpfiles/package_tasks");
const gitTasks = require("./scripts/gulpfiles/git_tasks");
const licenseTasks = require("./scripts/gulpfiles/license_tasks");

module.exports = {
  default: buildTasks.build,
  build: buildTasks.build,
  buildCore: buildTasks.core,
  buildBlocks: buildTasks.blocks,
  buildLangfiles: buildTasks.langfiles,
  buildUncompressed: buildTasks.uncompressed,
  buildCompressed: buildTasks.compressed,
  buildGenerators: buildTasks.generators,
  buildAdvancedCompilationTest: buildTasks.advancedCompilationTest,
  gitSyncDevelop: gitTasks.syncDevelop,
  gitSyncMaster: gitTasks.syncMaster,
  gitCreateRC: gitTasks.createRC,
  gitPreCompile: gitTasks.preCompile,
  gitPostCompile: gitTasks.postCompile,
  gitUpdateGithubPages: gitTasks.updateGithubPages,
  typings: gulp.series(typings.typings, typings.msgTypings),
  package: packageTasks.package,
  checkLicenses: licenseTasks.checkLicenses,
};
