cmake_minimum_required(VERSION 4.0.1)
set(CMAKE_MODULE_PATH "/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/cmake/Modules;/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/cmake/Modules;/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/cmake/Modules;/Users/derekgusatto/Documents/Git/emsdk/upstream/emscripten/cmake/Modules")
project(CheckASM_NASM ASM_NASM)
file(WRITE "${CMAKE_CURRENT_BINARY_DIR}/result.cmake"
  "set(CMAKE_ASM_NASM_COMPILER \"${CMAKE_ASM_NASM_COMPILER}\")\n"
  
  )