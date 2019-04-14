/*
 * This is the ***DELETOR***
 * All objects that need to be deleted, go through him.
 * Before an obj is deleted. The deletor will remove all dependent obj's first. 
 * i.e., 
 *  - transitions attached to a place marked for deletion
 *  - dependency port attached to a place or transition marked for deletion
 * 
 */
function deletor(deletion_obj){

    // determine the type of deletion obj
    switch(deletion_obj.type){
        case 'Component':
            console.log("Deletor has marked a " + deletion_obj.type + " for deletion");
            // remove connections attached to this component obj
            removeConnectionsAttachedToComponent(deletion_obj);
            // remove component konva elements
            removeComponentGroupKonva(deletion_obj);
            // remove reference to this obj from Global Component List
            removeComponentObjFromComponentList(deletion_obj);
    }

    // redraw layer
    layer.draw();
};

function removeComponentGroupKonva(component_obj){
    // destroys the component group and all of its children
    component_obj.component_group_konva.destroy();
};

function removeComponentObjFromComponentList(component_obj){
    console.log("Before " + component_list);
    // find index of component in component_list and remove
    component_list.splice( component_list.indexOf(component_obj), 1 );
    console.log("After " + component_list);
};

function removeConnectionsAttachedToComponent(component_obj){
    // check if connection is connected to this component
    for (var i = 0; i < component_obj.dependency_list.length; i++){
        for (var j = 0; j < connection_list.length; j++) {
            if (connection_list[j].provide_port_obj == component_obj.dependency_list[i] || connection_list[j].use_port_obj == component_obj.dependency_list[i]){
                removeConnectionKonva(connection_list[j]);
                removeConnectionObj(connection_list[j]);
            }
        }
    }
};