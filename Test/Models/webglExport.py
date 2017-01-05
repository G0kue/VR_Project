
bl_info = {
        "name": "MY FIRST BLENDER SCRIPT",
        "author": "Xavier Bourry",
        "blender": (2, 6, 3),
        "api": 35624,
        "location": "File > Import-Export",
        "description": "Export JS Meshes",
        "warning": "",
        "wiki_url": "http://www.webglacademy.com",
        "tracker_url": "",
        "support": 'OFFICIAL',
        "category": "Import-Export"}

import math
import os
import bpy
import string
from bpy.props import *
import mathutils, math
import struct
import shutil
from bpy_extras.io_utils import ExportHelper
from os import remove


class Export_mesh(bpy.types.Operator, ExportHelper):            
    bl_idname = "export_mesh.json"
    bl_label = "Export as JSON for webgl"

  filename_ext = ".json"
    filepath = ""
def execute(self, context):
    return save(self, context, **self.as_keywords(ignore=("check_existing", "filter_glob")))

def export_mesh(mesh, filepath):

    vertices="\"vertices\":["
    indices="\"indices\":["
    webgl_index=0
    vertices_indices=[]
    vertices_UVs=[]
    for v in range(0, len(mesh.vertices)):
            vertices_UVs.append([])
            vertices_indices.append([])


    UVmap=mesh.tessface_uv_textures[0].data;
        
    for face in mesh.tessfaces:

        for v in range(3):
            vertex_index=face.vertices[v]      # vertex index (int)
            vertex=mesh.vertices[vertex_index] # vertex object
            position=vertex.co                 # position of the vertex (vec3)
            normal=vertex.normal               # normal of the vertex (vec3)
            vertex_UV=UVmap[face.index].uv[v]
            
          alreadySaved=False
            index_UV=0
            for vUV in vertices_UVs[vertex_index]:
                if (vUV[0]==vertex_UV[0] and vUV[1]==vertex_UV[1]):
                    alreadySaved=True
                    break
                    
            index_UV+=1

          if (alreadySaved):
              indexe=vertices_indices[vertex_index][index_UV]

          else:
                    vertices_UVs[vertex_index].append(vertex_UV)
                    vertices_indices[vertex_index].append(webgl_index)
                    indexe=webgl_index
                    vertices+="%.4f,%.4f,%.4f,"%(position.x,position.y,position.z)
                    vertices+="%.4f,%.4f,%.4f,"%(normal.x,normal.y,normal.z)
                    vertices+="%.4f,%.4f,"%(vertex_UV[0], vertex_UV[1])
                    webgl_index+=1
           
          indices+="%i,"%(indexe)

    vertices=vertices.rstrip(',')
    indices=indices.rstrip(',')

    vertices+="],\n"
    indices+="]\n"

    header="{\n\"name\":\""+mesh.name+"\",\n"
    footer="}"
    file_handler = open(filepath, 'w')
    file_handler.write(header)
    file_handler.write(vertices)
    file_handler.write(indices)
    file_handler.write(footer)
    file_handler.close()

def save(operator, context, filepath="", use_apply_modifiers=False, use_triangulate=True, use_compress=False):
    count_objets=0

  scene = context.scene
    for objet in [objet for objet in scene.objects if objet.is_visible(scene)]:
        if (objet.type == 'MESH' and objet.select):
            selected_mesh=objet
            count_objets+=1
 

  if (count_objets==0):
        raise Exception("Erreur : Aucun mesh n'est selectionne")

  if (count_objets>1):
        raise Exception("Erreur : Ne selectionnez qu'un seul mesh")

  mesh = selected_mesh.to_mesh(scene, True, "PREVIEW")

  data_string = export_mesh(mesh, filepath)

  return {'FINISHED'}
        
### REGISTER ###

def menu_func(self, context):
    self.layout.operator(Export_mesh.bl_idname, text="Webglacademy JSON export (.json)")
    return

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)
    return

def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove(menu_func)
    return

if __name__ == "__main__":
    register()
