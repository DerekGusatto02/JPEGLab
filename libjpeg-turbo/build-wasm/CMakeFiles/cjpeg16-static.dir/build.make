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
CMAKE_BINARY_DIR = /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm

# Include any dependencies generated for this target.
include CMakeFiles/cjpeg16-static.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include CMakeFiles/cjpeg16-static.dir/compiler_depend.make

# Include the progress variables for this target.
include CMakeFiles/cjpeg16-static.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/cjpeg16-static.dir/flags.make

CMakeFiles/cjpeg16-static.dir/codegen:
.PHONY : CMakeFiles/cjpeg16-static.dir/codegen

CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o: CMakeFiles/cjpeg16-static.dir/flags.make
CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o: CMakeFiles/cjpeg16-static.dir/includes_C.rsp
CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o: /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/rdppm.c
CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o: CMakeFiles/cjpeg16-static.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --progress-dir=/Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building C object CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o"
	/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/emcc $(C_DEFINES) $(C_INCLUDES) $(C_FLAGS) -MD -MT CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o -MF CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o.d -o CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o -c /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/rdppm.c

CMakeFiles/cjpeg16-static.dir/src/rdppm.c.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Preprocessing C source to CMakeFiles/cjpeg16-static.dir/src/rdppm.c.i"
	/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/emcc $(C_DEFINES) $(C_INCLUDES) $(C_FLAGS) -E /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/rdppm.c > CMakeFiles/cjpeg16-static.dir/src/rdppm.c.i

CMakeFiles/cjpeg16-static.dir/src/rdppm.c.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Compiling C source to assembly CMakeFiles/cjpeg16-static.dir/src/rdppm.c.s"
	/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/emcc $(C_DEFINES) $(C_INCLUDES) $(C_FLAGS) -S /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/src/rdppm.c -o CMakeFiles/cjpeg16-static.dir/src/rdppm.c.s

cjpeg16-static: CMakeFiles/cjpeg16-static.dir/src/rdppm.c.o
cjpeg16-static: CMakeFiles/cjpeg16-static.dir/build.make
.PHONY : cjpeg16-static

# Rule to build all files generated by this target.
CMakeFiles/cjpeg16-static.dir/build: cjpeg16-static
.PHONY : CMakeFiles/cjpeg16-static.dir/build

CMakeFiles/cjpeg16-static.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/cjpeg16-static.dir/cmake_clean.cmake
.PHONY : CMakeFiles/cjpeg16-static.dir/clean

CMakeFiles/cjpeg16-static.dir/depend:
	cd /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm/CMakeFiles/cjpeg16-static.dir/DependInfo.cmake "--color=$(COLOR)"
.PHONY : CMakeFiles/cjpeg16-static.dir/depend

