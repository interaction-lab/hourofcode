Blockly.Blocks['create_sphere'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Make Sphere of")
        .appendField("size:")
        .appendField(new Blockly.FieldDropdown([["small","small"], ["medium","medium"], ["large","large"]]), "NAME");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['place'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Place Snowball");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(195);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['dance'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Dance");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};