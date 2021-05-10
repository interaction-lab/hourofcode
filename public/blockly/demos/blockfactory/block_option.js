/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Javascript for the BlockOption class, used to represent each
 * of the various blocks that you may select in the Block Selector. Each block
 * option has a checkbox, a label, and a preview workspace through which to
 * view the block.
 *
 * @author quachtina96 (Tina Quach)
 */
"use strict";

/**
 * BlockOption Class
 * A block option includes checkbox, label, and div element that shows a preview
 * of the block.
 * @param {!Element} blockSelector Scrollable div that will contain the
 *    block options for the selector.
 * @param {string} blockType Type of block for which to create an option.
 * @param {!Element} previewBlockXml XML element containing the preview block.
 * @constructor
 */
const BlockOption = function (blockSelector, blockType, previewBlockXml) {
  // The div to contain the block option.
  this.blockSelector = blockSelector;
  // The type of block represented by the option.
  this.blockType = blockType;
  // The checkbox for the option. Set in createDom.
  this.checkbox = null;
  // The dom for the option. Set in createDom.
  this.dom = null;
  // Xml element containing the preview block.
  this.previewBlockXml = previewBlockXml;
  // Workspace containing preview of block. Set upon injection of workspace in
  // showPreviewBlock.
  this.previewWorkspace = null;
  // Whether or not block the option is selected.
  this.selected = false;
  // Using this.selected rather than this.checkbox.checked allows for proper
  // handling of click events on the block option; Without this, clicking
  // directly on the checkbox does not toggle selection.
};

/**
 * Creates the dom for a single block option. Includes checkbox, label, and div
 * in which to inject the preview block.
 * @return {!Element} Root node of the selector dom which consists of a
 * checkbox, a label, and a fixed size preview workspace per block.
 */
BlockOption.prototype.createDom = function () {
  // Create the div for the block option.
  const blockOptContainer = document.createElement("div");
  blockOptContainer.id = this.blockType;
  blockOptContainer.classList.add("blockOption");

  // Create and append div in which to inject the workspace for viewing the
  // block option.
  const blockOptionPreview = document.createElement("div");
  blockOptionPreview.id = this.blockType + "_workspace";
  blockOptionPreview.classList.add("blockOption_preview");
  blockOptContainer.appendChild(blockOptionPreview);

  // Create and append container to hold checkbox and label.
  const checkLabelContainer = document.createElement("div");
  checkLabelContainer.classList.add("blockOption_checkLabel");
  blockOptContainer.appendChild(checkLabelContainer);

  // Create and append container for checkbox.
  const checkContainer = document.createElement("div");
  checkContainer.classList.add("blockOption_check");
  checkLabelContainer.appendChild(checkContainer);

  // Create and append checkbox.
  this.checkbox = document.createElement("input");
  this.checkbox.id = this.blockType + "_check";
  this.checkbox.setAttribute("type", "checkbox");
  checkContainer.appendChild(this.checkbox);

  // Create and append container for block label.
  const labelContainer = document.createElement("div");
  labelContainer.classList.add("blockOption_label");
  checkLabelContainer.appendChild(labelContainer);

  // Create and append text node for the label.
  const labelText = document.createElement("p");
  labelText.id = this.blockType + "_text";
  labelText.textContent = this.blockType;
  labelContainer.appendChild(labelText);

  this.dom = blockOptContainer;
  return this.dom;
};

/**
 * Injects a workspace containing the block into the block option's preview div.
 */
BlockOption.prototype.showPreviewBlock = function () {
  // Get ID of preview workspace.
  const blockOptPreviewID = this.dom.id + "_workspace";

  // Inject preview block.
  const demoWorkspace = Blockly.inject(blockOptPreviewID, { readOnly: true });
  Blockly.Xml.domToWorkspace(this.previewBlockXml, demoWorkspace);
  this.previewWorkspace = demoWorkspace;

  // Center the preview block in the workspace.
  this.centerBlock();
};

/**
 * Centers the preview block in the workspace.
 */
BlockOption.prototype.centerBlock = function () {
  // Get metrics.
  const block = this.previewWorkspace.getTopBlocks()[0];
  const blockMetrics = block.getHeightWidth();
  const blockCoordinates = block.getRelativeToSurfaceXY();
  const workspaceMetrics = this.previewWorkspace.getMetrics();

  // Calculate new coordinates.
  const x =
    workspaceMetrics.viewWidth / 2 -
    blockMetrics.width / 2 -
    blockCoordinates.x;
  const y =
    workspaceMetrics.viewHeight / 2 -
    blockMetrics.height / 2 -
    blockCoordinates.y;

  // Move block.
  block.moveBy(x, y);
};

/**
 * Selects or deselects the block option.
 * @param {!boolean} selected True if selecting option, false if deselecting
 *    option.
 */
BlockOption.prototype.setSelected = function (selected) {
  this.selected = selected;
  if (this.checkbox) {
    this.checkbox.checked = selected;
  }
};

/**
 * Returns boolean telling whether or not block is selected.
 * @return {!boolean} True if selecting option, false if deselecting
 *    option.
 */
BlockOption.prototype.isSelected = function () {
  return this.selected;
};
