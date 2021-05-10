/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PHP for procedure blocks.
 * @author daarond@gmail.com (Daaron Dwyer)
 */
"use strict";

goog.provide("Blockly.PHP.procedures");

goog.require("Blockly.PHP");

Blockly.PHP.procedures_defreturn = function (block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  let globals = [];
  let varName;
  const workspace = block.workspace;
  var variables = Blockly.Variables.allUsedVarModels(workspace) || [];
  for (var i = 0, variable; (variable = variables[i]); i++) {
    varName = variable.name;
    if (block.getVars().indexOf(varName) == -1) {
      globals.push(
        Blockly.PHP.variableDB_.getName(varName, Blockly.VARIABLE_CATEGORY_NAME)
      );
    }
  }
  // Add developer variables.
  const devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  for (var i = 0; i < devVarList.length; i++) {
    globals.push(
      Blockly.PHP.variableDB_.getName(
        devVarList[i],
        Blockly.Names.DEVELOPER_VARIABLE_TYPE
      )
    );
  }
  globals = globals.length
    ? Blockly.PHP.INDENT + "global " + globals.join(", ") + ";\n"
    : "";

  const funcName = Blockly.PHP.variableDB_.getName(
    block.getFieldValue("NAME"),
    Blockly.PROCEDURE_CATEGORY_NAME
  );
  let xfix1 = "";
  if (Blockly.PHP.STATEMENT_PREFIX) {
    xfix1 += Blockly.PHP.injectId(Blockly.PHP.STATEMENT_PREFIX, block);
  }
  if (Blockly.PHP.STATEMENT_SUFFIX) {
    xfix1 += Blockly.PHP.injectId(Blockly.PHP.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = Blockly.PHP.prefixLines(xfix1, Blockly.PHP.INDENT);
  }
  let loopTrap = "";
  if (Blockly.PHP.INFINITE_LOOP_TRAP) {
    loopTrap = Blockly.PHP.prefixLines(
      Blockly.PHP.injectId(Blockly.PHP.INFINITE_LOOP_TRAP, block),
      Blockly.PHP.INDENT
    );
  }
  const branch = Blockly.PHP.statementToCode(block, "STACK");
  let returnValue =
    Blockly.PHP.valueToCode(block, "RETURN", Blockly.PHP.ORDER_NONE) || "";
  let xfix2 = "";
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = Blockly.PHP.INDENT + "return " + returnValue + ";\n";
  }
  const args = [];
  var variables = block.getVars();
  for (var i = 0; i < variables.length; i++) {
    args[i] = Blockly.PHP.variableDB_.getName(
      variables[i],
      Blockly.VARIABLE_CATEGORY_NAME
    );
  }
  let code =
    "function " +
    funcName +
    "(" +
    args.join(", ") +
    ") {\n" +
    globals +
    xfix1 +
    loopTrap +
    branch +
    xfix2 +
    returnValue +
    "}";
  code = Blockly.PHP.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.PHP.definitions_["%" + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.PHP.procedures_defnoreturn = Blockly.PHP.procedures_defreturn;

Blockly.PHP.procedures_callreturn = function (block) {
  // Call a procedure with a return value.
  const funcName = Blockly.PHP.variableDB_.getName(
    block.getFieldValue("NAME"),
    Blockly.PROCEDURE_CATEGORY_NAME
  );
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] =
      Blockly.PHP.valueToCode(block, "ARG" + i, Blockly.PHP.ORDER_COMMA) ||
      "null";
  }
  const code = funcName + "(" + args.join(", ") + ")";
  return [code, Blockly.PHP.ORDER_FUNCTION_CALL];
};

Blockly.PHP.procedures_callnoreturn = function (block) {
  // Call a procedure with no return value.
  // Generated code is for a function call as a statement is the same as a
  // function call as a value, with the addition of line ending.
  const tuple = Blockly.PHP.procedures_callreturn(block);
  return tuple[0] + ";\n";
};

Blockly.PHP.procedures_ifreturn = function (block) {
  // Conditionally return value from a procedure.
  const condition =
    Blockly.PHP.valueToCode(block, "CONDITION", Blockly.PHP.ORDER_NONE) ||
    "false";
  let code = "if (" + condition + ") {\n";
  if (Blockly.PHP.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += Blockly.PHP.prefixLines(
      Blockly.PHP.injectId(Blockly.PHP.STATEMENT_SUFFIX, block),
      Blockly.PHP.INDENT
    );
  }
  if (block.hasReturnValue_) {
    const value =
      Blockly.PHP.valueToCode(block, "VALUE", Blockly.PHP.ORDER_NONE) || "null";
    code += Blockly.PHP.INDENT + "return " + value + ";\n";
  } else {
    code += Blockly.PHP.INDENT + "return;\n";
  }
  code += "}\n";
  return code;
};
