from flask import jsonify

from interface_adapters.presenters.drivers_presenter import present_drivers
from use_cases.get_drivers import GetDriversUseCase


class DriversController:
    def __init__(self, use_case: GetDriversUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        drivers = self._use_case.execute(year, race_round)
        return jsonify(present_drivers(drivers)), 200
