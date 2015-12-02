/* jshint node: true */
/* globals atom */
"use strict";
var exec = require("child_process").exec;
var fs = require("fs");
var parse = require("path").parse;

module.exports = {
  activate: function() {
    atom.commands.add("atom-text-editor", "gpp-compiler:compile", compile);
    atom.commands.add(".tree-view .file > .name", "gpp-compiler:treeCompile", treeCompile);
  },
  config: {
    addCompilingErr: {
      type: "boolean",
      default: true,
      title: "Add compiling_error.txt",
      description: "Add a file named \"compiling_error.txt\" if compiling goes wrong."
    }
  }
};

function compile(treePath) {
  var editor = atom.workspace.getActiveTextEditor();
  if (editor) {
    editor.save();
  }
  var info = parse(typeof treePath == "string" ? treePath : editor.getPath());
  exec("g++ \"" + info.base + "\" -o \"" + info.name + "\"", {cwd: info.dir}, function(err, stdout, stderr) {
    if (stderr) {
      if (atom.notifications) {
        atom.notifications.add("error", stderr.replace(/\n/g, "<br>"));
      }
      if (atom.config.get("gpp-compiler.addCompilingErr")) {
        fs.writeFile(info.dir + "/compiling_error.txt", stderr);
      }
    } else {
      if (process.platform == "win32") {
        exec("start \"" + info.name + "\" \"" + info.name + "\"", {
          cwd: info.dir
        });
      } else if (process.platform == "linux") {
        exec("gnome-terminal -e \"./" + info.name.replace(/ /g, "\\ ") + "\"", {cwd: info.dir});
      } else if (process.platform == "darwin") {
        exec("open \"" + info.name.replace(/ /g, "\\ ") + "\"");
      }
      fs.readFile(info.dir + "/compiling_error.txt", function(err) {
        if (!err) {
          fs.unlink(info.dir + "/compiling_error.txt");
        }
      });
    }
  });
}

function treeCompile(e) {
  compile(e.target.getAttribute("data-path"));
}
