from mad import *
import time
import os
import subprocess

class Component_2(Component):
	def create(self):
		self.places = [
			'Place_1',
			'Place_2'
		]

		self.transitions = {
			'Transition_1': ('Place_1', 'undefined', self.undefined)
		}

		self.dependencies = {
			'Dependency_1': (DepType.USE, ['place_name'])
		}

	def undefined(self):
		time.sleep(0)

