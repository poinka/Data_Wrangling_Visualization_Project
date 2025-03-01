import scrapy
import re

# Define separate items for films and actors
class Film(scrapy.Item):
    title = scrapy.Field()
    year = scrapy.Field()
    directors = scrapy.Field()
    countries = scrapy.Field()
    production_budget = scrapy.Field()
    box_office = scrapy.Field()
    imdb = scrapy.Field()
    metascore = scrapy.Field()
    num_of_awards = scrapy.Field()
    num_of_nominations = scrapy.Field()
    genres = scrapy.Field()
    actors = scrapy.Field()
    film_type = scrapy.Field()

class Actor(scrapy.Item):
    id = scrapy.Field()
    name = scrapy.Field()
    surname = scrapy.Field()
    popularity = scrapy.Field()
    url = scrapy.Field()

class ImdbFilmSpider(scrapy.Spider):
    name = 'imdb_film'
    allowed_domains = ['imdb.com']
    start_urls = ['https://www.imdb.com/search/title/?genres=!documentary,!short&explore=genres']

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1,
    }

    # Use a set to track actor IDs to avoid duplicate actor requests
    actor_seen = set()

    def parse(self, response):
        films = response.css('li.ipc-metadata-list-summary-item')
        self.logger.info("Found %d film items on the page", len(films))
        for film in films:
            # Extract title and clean ranking prefix
            raw_title = film.css('h3.ipc-title__text::text').get()
            title = re.sub(r'^\d+\.\s*', '', raw_title) if raw_title else None

            # Extract year from metadata
            metadata = film.css('span.dli-title-metadata-item::text').getall()
            year = None
            if metadata:
                m = re.search(r'(\d{4})', metadata[0])
                if m:
                    year = int(m.group(1))
            
            # Skip TV Series or TV Mini Series
            film_type = film.css('span.dli-title-type-data::text').get()
            if film_type and ("TV Series" in film_type or "TV Mini Series" in film_type):
                continue

            # Extract IMDb rating
            imdb_rating_text = film.css('span.ipc-rating-star--rating::text').get()
            imdb_rating = float(imdb_rating_text) if imdb_rating_text else None

            # Build film detail URL
            film_url_relative = film.css('a.ipc-title-link-wrapper::attr(href)').get()
            film_url = response.urljoin(film_url_relative) if film_url_relative else None

            self.logger.info("Processing film: %s, Year: %s, URL: %s", title, year, film_url)
            if film_url:
                meta = {'title': title, 'year': year, 'imdb': imdb_rating}
                if film_type:
                    meta['film_type'] = film_type
                yield scrapy.Request(
                    url=film_url,
                    callback=self.parse_film_detail,
                    meta={'film': meta},
                    dont_filter=True
                )

        # Follow pagination if available
        next_page = response.css('a.lister-page-next.next-page::attr(href)').get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)

    def parse_film_detail(self, response):
        film = response.meta['film']
        self.logger.info("Parsing detail for film: %s (status %s)", film.get('title'), response.status)

        if response.status != 200:
            self.logger.warning("Non-200 response for %s; yielding basic info.", film.get('title'))
            yield {'film': film}
            return

        # Extract directors (remove duplicates)
        directors = list(set(response.xpath(
            '//li[@data-testid="title-pc-principal-credit"][.//span[contains(text(),"Director")]]'
            '//a[contains(@href, "/name/")]/text()'
        ).getall()))
        film['directors'] = directors

        # Extract countries
        film['countries'] = response.xpath('//li[@data-testid="title-details-origin"]//a/text()').getall()

        # Extract production budget and box office using helper
        film['production_budget'] = self.parse_money(response.xpath('//li[@data-testid="title-boxoffice-budget"]//text()').getall())
        film['box_office'] = self.parse_money(response.xpath('//li[@data-testid="title-boxoffice-cumulativeworldwidegross"]//text()').getall())

        # Extract metascore
        metascore_text = response.xpath('//span[contains(@class, "metacritic-score-box")]/text()').get()
        film['metascore'] = int(metascore_text.strip()) if metascore_text and metascore_text.strip().isdigit() else None

        # Extract genres (using the working structure)
        film['genres'] = response.xpath('//div[@data-testid="interests"]//span[contains(@class,"ipc-chip__text")]/text()').getall()

        # Extract actors and schedule actor page requests for popularity
        actors = []
        cast_rows = response.xpath('//div[@data-testid="title-cast-item"]')
        for row in cast_rows:
            full_name = row.xpath('.//a[contains(@data-testid, "title-cast-item__actor")]/text()').get()
            actor_url_relative = row.xpath('.//a[contains(@data-testid, "title-cast-item__actor")]/@href').get()
            if full_name and actor_url_relative:
                parts = full_name.split()
                name = parts[0]
                surname = parts[-1] if len(parts) > 1 else ''
                actor_url = response.urljoin(actor_url_relative)
                actor_id_match = re.search(r'/name/(nm\d+)/', actor_url)
                actor_id = actor_id_match.group(1) if actor_id_match else None
                actor_data = {
                    'name': name,
                    'surname': surname,
                    'popularity': 0,  # placeholder
                    'url': actor_url,
                    'id': actor_id
                }
                actors.append(actor_data)
                if actor_id and actor_id not in self.actor_seen:
                    self.actor_seen.add(actor_id)
                    yield scrapy.Request(
                        url=actor_url,
                        callback=self.parse_actor,
                        meta={'actor_data': actor_data}
                    )
        film['actors'] = actors

        # Schedule awards page request
        film_url = response.url
        film_id_match = re.search(r'/title/(tt\d+)/', film_url)
        if film_id_match:
            film_id = film_id_match.group(1)
            awards_url = response.urljoin(f'/title/{film_id}/awards/')
            self.logger.info("Scheduling awards page for film %s: %s", film.get('title'), awards_url)
            yield scrapy.Request(
                url=awards_url,
                callback=self.parse_awards,
                meta={'film': film},
                dont_filter=True
            )
        else:
            yield {'film': film}

    def parse_awards(self, response):
        film = response.meta['film']
        self.logger.info("Parsing awards for film: %s", film.get('title'))
        awards_text = response.css('div[data-testid="awards-signpost"] div.ipc-signpost__text::text').get()
        wins = 0
        nominations = 0
        if awards_text:
            wins_match = re.search(r'(\d+)\s+wins', awards_text, re.IGNORECASE)
            noms_match = re.search(r'(\d+)\s+nominations', awards_text, re.IGNORECASE)
            wins = int(wins_match.group(1)) if wins_match else 0
            nominations = int(noms_match.group(1)) if noms_match else 0
        film['num_of_awards'] = wins
        film['num_of_nominations'] = nominations
        yield {'film': film}

    def parse_money(self, text_list):
        text = " ".join(text_list).strip()
        match = re.search(r'\$([\d,]+)', text)
        if match:
            money_str = match.group(1).replace(',', '')
            try:
                return int(money_str)
            except ValueError:
                return None
        return None

    def parse_actor(self, response):
        actor_data = response.meta['actor_data']
        popularity_text = response.css('span.starmeter-difference::text').get()
        popularity = int(popularity_text.strip()) if popularity_text and popularity_text.strip().isdigit() else 0
        actor_data['popularity'] = popularity
        self.logger.info("Actor %s %s popularity: %d", actor_data['name'], actor_data['surname'], popularity)
        yield {'actor': actor_data}
