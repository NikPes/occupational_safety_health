import backend.app.subject_structure.models.division_models as div_mod

class ActionDivPosition(div_mod.DivPosition):
    @classmethod
    def get_positions_by_division(cls, division_id):
        print(division_id)
        """Получение должностей для подразделения в правильном формате"""
        try:
            # Получаем связи DivPosition для данного подразделения
            div_positions = cls.query.filter_by(id_division=division_id).all()

            positions = []
            for div_position in div_positions:
                # Получаем информацию о должности
                all_position = div_mod.AllPosition.query.get(div_position.id_position)
                if all_position:
                    positions.append({
                        'id': all_position.id,
                        'name': all_position.position  # или all_position.position_name в зависимости от модели
                    })
            print(positions)
            return positions

        except Exception as e:
            raise Exception(f"Error getting positions: {str(e)}")


