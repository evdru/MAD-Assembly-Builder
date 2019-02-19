from mad import *
import time
import os
import subprocess

class Component_1(Component):
	def create(self):
		self.places = [
			'Place_1',
			'Place_2'
		]

		self.transitions = {
			'Transition_1': ('Place_1', 'undefined', self.undefined),
			'Transition_2': ('Place_1', 'undefined', self.undefined),
			'Transition_3': ('Place_1', 'undefined', self.undefined)
		}

		self.dependencies = {
			'Dependency_1': (DepType.PROVIDE, ['place_name'])
		}

	def undefined(self):
		time.sleep(9)

	def undefined(self):
		time.sleep(10)

	def undefined(self):
		time.sleep(10)

