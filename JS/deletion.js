/*
 * This is the ***DELETOR***
 * All objects that need to be deleted, go through him.
 * Before an obj is deleted. The deletor will remove all dependent obj's first. 
 * i.e., 
 *  - dependency port attached to a place or transition marked for deletion
 *  - inbound and outbound transitions attached to a place marked for deletion
 * 
 */
function deletor(deletion_obj){

    // determine the type of deletion obj
    switch(deletion_obj.type){
        case 'Component':
            console.log("Deletor has marked a " + deletion_obj.type + " for deletion");
            componentDeletionHandler(deletion_obj);
            break;
        case 'Place':
            placeDeletionHandler(deletion_obj);
            break;
        case 'Transition':
            transitionDeletionHandler(deletion_obj);
            break;
        case 'PROVIDE':
        case 'USE':
        case 'DATA_PROVIDE':
        case 'DATA_USE':
            // all dependency obj's
            dependencyDeletionHandler(deletion_obj);
            break;

        default:
            console.log("Object to be deleted has unknown type: " + deletion_obj.type);
    }

    // redraw layer
    layer.draw();
};

// Handles deletion of Component Obj
function componentDeletionHandler(component_obj){
    // remove connections attached to this component obj
    removeConnectionsAttachedToComponent(component_obj);
    // remove reference to this obj from Global Component List
    removeComponentObjFromComponentList(component_obj);
    // remove component konva elements
    removeComponentGroupKonva(component_obj);
};

// Handles deletion of Dependency Obj
function dependencyDeletionHandler(dependency_obj){
    //removeDependencyObj(dependency_obj);
    removeConnectionObjFromDependencyConnectionList(dependency_obj);
    removeDependencyObjFromComponentDependencyList(dependency_obj);
    decrementSourceObjDependencyCount(dependency_obj.source_obj);
    removeDependencyGroupKonva(dependency_obj);
    // if the dependency is coming out of a transition
    if(dependency_obj.source_obj.type == "Transition"){ hideTransitionSelectionArea(dependency_obj.source_obj); }
};

// Handles deletion of Place Obj
function placeDeletionHandler(place_obj){
    removeDependencyAttachedToPlace(place_obj);
    removeOutboundTransitions(place_obj);
    removeInboundTransitions(place_obj);    
    removePlaceObjFromComponentPlaceList(place_obj);
    removePlaceKonva(place_obj);
};

// Handles deletion of transition obj
function transitionDeletionHandler(transition_obj){
    // remove dependencies attached to transition obj
    removeDependencyAttachedToTransition(transition_obj);
    decrementPlaceTransitionCount(transition_obj.src);
    removeTransitionObjFromPlaceOutboundList(transition_obj);
    removeTransitionObjFromPlaceInboundList(transition_obj);
    removeTransitionGroupKonva(transition_obj);
    removeTransitionObjFromComponentTransitionList(transition_obj);
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

function removeDependencyAttachedToPlace(place_obj){
    for (var i = 0; i < place_obj.dependency_obj_list.length; i++){
        // dependency attached to this place
        // send dependency obj to dependency deletion handler
        dependencyDeletionHandler(place_obj.dependency_obj_list[i]);
    }
};

// destroys the konva group associated with this obj
function removeDependencyGroupKonva(dependency_obj){
    dependency_obj.dep_group_konva.destroy();
};

function removeDependencyObjFromComponentDependencyList(dependency_obj){
    dependency_obj.component_obj.dependency_list.splice( dependency_obj.component_obj.dependency_list.indexOf(dependency_obj), 1 );
};

// Called when a dependency removed from a place/transition
// source_obj can be either place or transition
function decrementSourceObjDependencyCount(source_obj){
    source_obj.dependency_count--;
};

function removeConnectionObj(connection_obj){
    connection_obj.use_port_obj.connection_obj = undefined
    connection_obj.provide_port_obj.connection_obj = undefined
    // set opacity to 0 for dependencies
    if(connection_obj.provide_port_obj.connection_list.length == 1){
        connection_obj.provide_port_obj.dep_stub_konva.opacity(0);
    }
    
    if(connection_obj.use_port_obj.connection_list.length == 1){
        connection_obj.use_port_obj.dep_stub_konva.opacity(0);
    }
    // remove connection from connection list
    connection_list.splice( connection_list.indexOf(connection_obj), 1 );
    removeConnectionKonva(connection_obj);
};

function removeConnectionObjFromDependencyConnectionList(dependency_obj){
    for(var i = 0; i < dependency_obj.connection_list.length; i++){
        removeConnectionObj(dependency_obj.connection_list[i]);
    }
}

// function to remove connection konva group
function removeConnectionKonva(connection_obj){
    // destroy the connection group
    connection_obj.connection_group_konva.destroy();
};

// removes all transitions attached to place_obj
function removeOutboundTransitions(place_obj){
    // remove all outbound transitions from this place_obj
    for (var i = 0; i < place_obj.transition_outbound_list.length; i++){
        console.log("removeOutBoundTranstions sending Transition " + place_obj.transition_outbound_list[i].name)
        //transitionDeletionHandler(place_obj.transition_outbound_list[i]);
        decrementPlaceTransitionCount(place_obj.transition_outbound_list[i].src);
        removeDependencyAttachedToTransition(place_obj.transition_outbound_list[i]);
        removeTransitionGroupKonva(place_obj.transition_outbound_list[i]);
        removeTransitionObjFromComponentTransitionList(place_obj.transition_outbound_list[i]);
    }
};

function removeInboundTransitions(place_obj){
    // remove all inbound transitions from this place_obj
    for (var i = 0; i < place_obj.transition_inbound_list.length; i++){
        console.log("removeInBoundTranstions sending Transition " + place_obj.transition_inbound_list[i].name)
        //transitionDeletionHandler(place_obj.transition_inbound_list[i]);
        decrementPlaceTransitionCount(place_obj.transition_inbound_list[i].src);
        removeDependencyAttachedToTransition(place_obj.transition_inbound_list[i]);
        removeTransitionGroupKonva(place_obj.transition_inbound_list[i]);
        removeTransitionObjFromComponentTransitionList(place_obj.transition_inbound_list[i]);
    }
};

function removePlaceKonva(place_obj){
    place_obj.place_konva.destroy();
};

function removePlaceObjFromComponentPlaceList(place_obj){
    var component_obj = place_obj.component_obj;
    // find index of place_obj in component_obj place list and remove
    component_obj.place_list.splice( component_obj.place_list.indexOf(place_obj), 1 );
};

function removeDependencyAttachedToTransition(transition_obj){
    for (var i = 0; i < transition_obj.dependency_obj_list.length; i++){
        // dependency attached to this place
        // send dependency obj to dependency deletion handler
        dependencyDeletionHandler(transition_obj.dependency_obj_list[i]);
    }
};

function removeTransitionObjFromComponentTransitionList(transition_obj){
    transition_obj.component_obj.transition_list.splice( transition_obj.component_obj.transition_list.indexOf(transition_obj), 1 );
};

function removeTransitionObjFromPlaceOutboundList(transition_obj){
    // remove itself from its src outbound list
    console.log("Removing Transition " + transition_obj.name + " from place outbound list...")
    transition_obj.src.transition_outbound_list.splice( transition_obj.src.transition_outbound_list.indexOf(transition_obj), 1 );
};

function removeTransitionObjFromPlaceInboundList(transition_obj){
    // remove itself from its dest inbound list
    console.log("Removing Transition " + transition_obj.name + " from place inbound list...")
    transition_obj.dest.transition_inbound_list.splice( transition_obj.dest.transition_inbound_list.indexOf(transition_obj), 1 );
};

function removeTransitionGroupKonva(transition_obj){
    transition_obj.tran_konva.destroy();
    transition_obj.tran_group_konva.destroy();
};

function decrementPlaceTransitionCount(place_obj){
    place_obj.transition_count--;
};

function decrementPlaceTransitionDict(component_obj, source_place, dest_place){
    var source_obj_name = source_place.name;
    var dest_obj_name = dest_place.name;
    // check the transition dictionary for parallel transitions
    if(component_obj.transition_dictionary[source_obj_name] && component_obj.transition_dictionary[source_obj_name][dest_obj_name]){
        console.log("Decrementing dictionary keys");
        console.log("source name: " + source_obj_name);
        console.log("dest name: " + dest_obj_name);
        console.log(Object.entries(component_obj.transition_dictionary));
        // decrement the trans dict
        component_obj.transition_dictionary[source_obj_name][dest_obj_name]--;
    }
};