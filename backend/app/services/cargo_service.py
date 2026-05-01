class CargoService:
    _cargos = []

    @staticmethod
    def get_all():
        return CargoService._cargos.copy()

    @staticmethod
    def get_by_id(cargo_id):
        for cargo in CargoService._cargos:
            if cargo['id'] == cargo_id:
                return cargo
        return None

    @staticmethod
    def create(cargo_data):
        if not cargo_data.get('id'):
            max_id = max([c.get('id', 0) for c in CargoService._cargos], default=0)
            cargo_data['id'] = max_id + 1
        CargoService._cargos.append(cargo_data)
        return cargo_data

    @staticmethod
    def update(cargo_id, cargo_data):
        cargo = CargoService.get_by_id(cargo_id)
        if cargo:
            cargo.update(cargo_data)
            return cargo
        return None

    @staticmethod
    def delete(cargo_id):
        cargo = CargoService.get_by_id(cargo_id)
        if cargo:
            CargoService._cargos.remove(cargo)
            return True
        return False