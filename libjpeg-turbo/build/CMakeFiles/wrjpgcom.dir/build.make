# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 4.0

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /opt/homebrew/bin/cmake

# The command to remove a file.
RM = /opt/homebrew/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build

# Include any dependencies generated for this target.
include CMakeFiles/wrjpgcom.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include CMakeFiles/wrjpgcom.dir/compiler_depend.make

# Include the progress variables for this target.
include CMakeFiles/wrjpgcom.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/wrjpgcom.dir/flags.make

CMakeFiles/wrjpgcom.dir/codegen:
.PHONY : CMakeFiles/wrjpgcom.dir/codegen

CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o: CMakeFiles/wrjpgcom.dir/flags.make
CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o: CMakeFiles/wrjpgcom.dir/includes_C.rsp
CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o: /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/wrjpgcom.c
CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o: CMakeFiles/wrjpgcom.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --progress-dir=/Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building C object CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o"
	/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/emcc $(C_DEFINES) $(C_INCLUDES) $(C_FLAGS) -MD -MT CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o -MF CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o.d -o CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o -c /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/wrjpgcom.c

CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Preprocessing C source to CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.i"
	/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/emcc $(C_DEFINES) $(C_INCLUDES) $(C_FLAGS) -E /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/wrjpgcom.c > CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.i

CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Compiling C source to assembly CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.s"
	/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/emcc $(C_DEFINES) $(C_INCLUDES) $(C_FLAGS) -S /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/wrjpgcom.c -o CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.s

# Object files for target wrjpgcom
wrjpgcom_OBJECTS = \
"CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o"

# External object files for target wrjpgcom
wrjpgcom_EXTERNAL_OBJECTS =

wrjpgcom.js: CMakeFiles/wrjpgcom.dir/src/wrjpgcom.c.o
wrjpgcom.js: CMakeFiles/wrjpgcom.dir/build.make
wrjpgcom.js: CMakeFiles/wrjpgcom.dir/objects1.rsp
wrjpgcom.js: CMakeFiles/wrjpgcom.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --bold --progress-dir=/Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Linking C executable wrjpgcom.js"
	$(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/wrjpgcom.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
CMakeFiles/wrjpgcom.dir/build: wrjpgcom.js
.PHONY : CMakeFiles/wrjpgcom.dir/build

CMakeFiles/wrjpgcom.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/wrjpgcom.dir/cmake_clean.cmake
.PHONY : CMakeFiles/wrjpgcom.dir/clean

CMakeFiles/wrjpgcom.dir/depend:
	cd /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build/CMakeFiles/wrjpgcom.dir/DependInfo.cmake "--color=$(COLOR)"
.PHONY : CMakeFiles/wrjpgcom.dir/depend

