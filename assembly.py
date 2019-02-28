from mad import *

from maria_db import maria_db
from apache import apache

if __name__ == '__main__':
	maria_db = maria_db()

	apache = apache()

	assembly = Assembly()
	assembly.addComponent('maria_db', maria_db)
	assembly.addComponent('apache', apache)
	assembly.addConnection(maria_db, 'ipprov', apache, 'ip_use')
	assembly.addConnection(maria_db, 'mdb_provide', apache, 'mdb_use')

	mad = Mad(assembly)
	mad.run()
