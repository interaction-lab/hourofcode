/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

suite("Key Map Tests", function () {
  setup(function () {
    sharedTestSetup.call(this);
    Blockly.user.keyMap.setKeyMap(Blockly.user.keyMap.createDefaultKeyMap());
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  test("Test adding a new action to key map", function () {
    const newAction = new Blockly.Action("test_action", "test", function () {
      return "test";
    });
    Blockly.user.keyMap.setActionForKey("65", newAction);
    chai.assert.equal(Blockly.user.keyMap.map_["65"].name, "test_action");
  });

  test("Test giving an old action a new key", function () {
    Blockly.user.keyMap.setActionForKey(
      Blockly.utils.KeyCodes.F,
      Blockly.navigation.ACTION_PREVIOUS
    );
    chai.assert.isUndefined(Blockly.user.keyMap.map_[Blockly.utils.KeyCodes.W]);
    chai.assert.equal(
      Blockly.user.keyMap.map_[Blockly.utils.KeyCodes.F],
      Blockly.navigation.ACTION_PREVIOUS
    );
  });

  test("Test get key by action defined", function () {
    const key = Blockly.user.keyMap.getKeyByAction(
      Blockly.navigation.ACTION_PREVIOUS
    );
    chai.assert.equal(key, Blockly.utils.KeyCodes.W);
  });

  test("Test get key by action not defined", function () {
    const key = Blockly.user.keyMap.getKeyByAction(
      new Blockly.Action("something")
    );
    chai.assert.notExists(key);
  });

  test("Test set key map", function () {
    const testKeyMap = Blockly.user.keyMap.createDefaultKeyMap();
    testKeyMap.randomKey = new Blockly.Action("test", "", null);
    Blockly.user.keyMap.setKeyMap(testKeyMap);
    chai.assert.equal(Blockly.user.keyMap.map_.randomKey.name, "test");
  });

  test("Test get key map returns a clone", function () {
    const keyMap = Blockly.user.keyMap.getKeyMap();
    keyMap.randomKey = new Blockly.Action("test", "", null);
    chai.assert.isUndefined(Blockly.user.keyMap.map_.randomKey);
  });

  test("Test serialize key code with modifiers", function () {
    const mockEvent = {
      getModifierState: function () {
        return true;
      },
      keyCode: 65,
    };
    const serializedKey = Blockly.user.keyMap.serializeKeyEvent(mockEvent);
    chai.assert.equal(serializedKey, "ShiftControlAltMeta65");
  });

  test("Test serialize key code without modifiers", function () {
    const mockEvent = {
      getModifierState: function () {
        return false;
      },
      keyCode: 65,
    };
    const serializedKey = Blockly.user.keyMap.serializeKeyEvent(mockEvent);
    chai.assert.equal(serializedKey, "65");
  });

  test("Test modifiers in reverse order", function () {
    const testKey = Blockly.user.keyMap.createSerializedKey(
      Blockly.utils.KeyCodes.K,
      [
        Blockly.user.keyMap.modifierKeys.CONTROL,
        Blockly.user.keyMap.modifierKeys.SHIFT,
      ]
    );
    Blockly.user.keyMap.setActionForKey(
      testKey,
      new Blockly.Action("test", "", null)
    );
    const action = Blockly.user.keyMap.getActionByKeyCode("ShiftControl75");
    chai.assert.isNotNull(action);
    chai.assert.equal(action.name, "test");
  });

  test("Test report invalid modifiers", function () {
    const shouldThrow = function () {
      Blockly.user.keyMap.createSerializedKey(Blockly.utils.KeyCodes.K, [
        "s",
        Blockly.user.keyMap.modifierKeys.SHIFT,
      ]);
    };
    chai.assert.throws(shouldThrow, Error, "s is not a valid modifier key.");
  });

  teardown(function () {});
});
