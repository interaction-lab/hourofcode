/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Tests for gesture.
 * @author marisaleung@google.com (Marisa Leung)
 */
"use strict";

suite("Gesture", function () {
  function testGestureIsFieldClick(block, isFieldClick, eventsFireStub) {
    const field = block.getField("NAME");
    const eventTarget = field.getClickTarget_();
    chai.assert.exists(
      eventTarget,
      "Precondition: missing click target for field"
    );

    eventsFireStub.resetHistory();
    dispatchPointerEvent(eventTarget, "pointerdown");

    const fieldWorkspace = field.sourceBlock_.workspace;
    // Gestures triggered on flyouts are stored on targetWorkspace.
    const gestureWorkspace = fieldWorkspace.targetWorkspace || fieldWorkspace;
    const gesture = gestureWorkspace.currentGesture_;
    chai.assert.exists(gesture, "Gesture exists after pointerdown.");
    const isFieldClickSpy = sinon.spy(gesture, "isFieldClick_");

    dispatchPointerEvent(eventTarget, "pointerup");
    dispatchPointerEvent(eventTarget, "click");

    sinon.assert.called(isFieldClickSpy);
    chai.assert.isTrue(isFieldClickSpy.alwaysReturned(isFieldClick));

    assertEventFired(
      eventsFireStub,
      Blockly.Events.Ui,
      { element: "selected", oldValue: null, newValue: block.id },
      fieldWorkspace.id,
      null
    );
    assertEventNotFired(eventsFireStub, Blockly.Events.Ui, {
      element: "click",
    });
  }

  function getTopFlyoutBlock(flyout) {
    return flyout.workspace_.topBlocks_[0];
  }

  setup(function () {
    sharedTestSetup.call(this);
    defineBasicBlockWithField(this.sharedCleanup);
    const toolbox = document.getElementById("gesture-test-toolbox");
    this.workspace = Blockly.inject("blocklyDiv", { toolbox: toolbox });
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test("Constructor", function () {
    const e = { id: "dummy_test_event" };
    const gesture = new Blockly.Gesture(e, this.workspace);
    chai.assert.equal(gesture.mostRecentEvent_, e);
    chai.assert.equal(gesture.creatorWorkspace_, this.workspace);
  });

  test("Field click - Click in workspace", function () {
    const block = this.workspace.newBlock("test_field_block");
    block.initSvg();
    block.render();

    testGestureIsFieldClick(block, true, this.eventsFireStub);
  });

  test("Field click - Auto close flyout", function () {
    const flyout = this.workspace.flyout_;
    chai.assert.exists(this.workspace.flyout_, "Precondition: missing flyout");
    flyout.autoClose = true;

    const block = getTopFlyoutBlock(flyout);
    testGestureIsFieldClick(block, false, this.eventsFireStub);
  });

  test("Field click - Always open flyout", function () {
    const flyout = this.workspace.flyout_;
    chai.assert.exists(this.workspace.flyout_, "Precondition: missing flyout");
    flyout.autoClose = false;

    const block = getTopFlyoutBlock(flyout);
    testGestureIsFieldClick(block, true, this.eventsFireStub);
  });

  test("Shift click in accessibility mode - moves the cursor", function () {
    this.workspace.keyboardAccessibilityMode = true;

    const eventTarget = this.workspace.svgGroup_;
    simulateClick(eventTarget, { shiftKey: true });

    const cursor = this.workspace.getCursor();
    const cursorNode = cursor.getCurNode();
    chai.assert.exists(cursorNode);
    chai.assert.equal(cursorNode.getType(), Blockly.ASTNode.types.WORKSPACE);
  });
});
