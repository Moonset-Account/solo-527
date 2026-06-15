require "pagy/extras/overflow"
require "pagy/extras/i18n"

Pagy::DEFAULT[:items] = 20
Pagy::DEFAULT[:overflow] = :last_page
Pagy::DEFAULT[:size] = [1, 4, 4, 1]
