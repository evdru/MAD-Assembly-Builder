from mad import *

from component_1 import Component_1
from component_2 import Component_2

if __name__ == '__main__':
	component_1 = Component_1()

	component_2 = Component_2()

	assembly = Assembly()
	assembly.addComponent('component_1', component_1)
	assembly.addComponent('component_2', component_2)

	mad = Mad(assembly)
	mad.run()
