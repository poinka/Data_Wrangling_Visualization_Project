import scrapy
import re

# class for scraped data
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


# spider class
class ImdbFilmSpider(scrapy.Spider):
    name = 'imdb_film'
    allowed_domains = ['imdb.com']
    start_urls = ['https://www.imdb.com/search/title/?genres=!documentary,!short&explore=genres']

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1,  # be kind to the server
    }

    def parse(self, response):
        # Select all film items from the list using the provided ul/li structure
        films = response.css('li.ipc-metadata-list-summary-item')
        self.logger.info("Found %d film items on the page", len(films))
        for film in films:
            # Extract the raw title text (which may include a ranking prefix like "28. ")
            raw_title = film.css('h3.ipc-title__text::text').get()
            title = re.sub(r'^\d+\.\s*', '', raw_title) if raw_title else None

            # Extract the year from the metadata items.
            metadata = film.css('span.dli-title-metadata-item::text').getall()
            year = None
            if metadata:
                match = re.search(r'(\d{4})', metadata[0])
                if match:
                    year = int(match.group(1))
            
            # Extract the film type – skip if it is a TV Series or TV Mini Series.
            film_type = film.css('span.dli-title-type-data::text').get()
            if film_type and ("TV Series" in film_type or "TV Mini Series" in film_type):
                continue

            # Extract IMDb rating from the film item.
            imdb_rating_text = film.css('span.ipc-rating-star--rating::text').get()
            imdb_rating = float(imdb_rating_text) if imdb_rating_text else None

            # Extract the relative URL to the film detail page.
            film_url_relative = film.css('a.ipc-title-link-wrapper::attr(href)').get()
            film_url = response.urljoin(film_url_relative) if film_url_relative else None

            self.logger.info("Processing film: %s, Year: %s, URL: %s", title, year, film_url)
            # Pass basic info via meta to the detail page parser.
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

        # Follow pagination if available.
        next_page = response.css('a.lister-page-next.next-page::attr(href)').get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)

    def parse_film_detail(self, response):
        film = response.meta['film']
        self.logger.info("Parsing detail for film: %s (status %s)", film.get('title'), response.status)

        # If response is not 200, log a warning and yield what we have.
        if response.status != 200:
            self.logger.warning("Non-200 response for %s; yielding basic info.", film.get('title'))
            yield {'film': film}
            return

        # Extract directors.
        directors = response.xpath(
            '//div[contains(@data-testid, "title-pc-principal-credit") and .//a[contains(@href, "tt_ov_dr")]]//a/text()'
        ).getall()
        film['directors'] = directors

        # Extract countries.
        countries = response.xpath('//li[@data-testid="title-details-origin"]//a/text()').getall()
        film['countries'] = countries

        # Extract production budget.
        budget_text_list = response.xpath('//li[@data-testid="title-boxoffice-budget"]//text()').getall()
        film['production_budget'] = self.parse_money(budget_text_list)

        # Extract box office.
        box_office_text_list = response.xpath('//li[@data-testid="title-boxoffice-cumulativeworldwidegross"]//text()').getall()
        film['box_office'] = self.parse_money(box_office_text_list)

        # Extract metascore (using the updated selector).
        metascore_text = response.xpath('//span[contains(@class, "metacritic-score-box")]/text()').get()
        film['metascore'] = int(metascore_text.strip()) if metascore_text and metascore_text.strip().isdigit() else None

        # Extract awards.
        awards_text = response.xpath('//span[contains(@data-testid, "awards-info")]/text()').get()
        film['num_of_awards'], film['num_of_nominations'] = self.extract_awards(awards_text)

        # Extract genres.
        genres = response.xpath('//li[@data-testid="storyline-genres"]//a/text()').getall()
        film['genres'] = genres

        # Extract actors.
        actors = []
        cast_rows = response.xpath('//div[@data-testid="title-cast-item"]')
        for row in cast_rows:
            full_name = row.xpath('.//a[contains(@data-testid, "title-cast-item__actor")]/text()').get()
            if full_name:
                parts = full_name.split()
                name = parts[0]
                surname = parts[-1] if len(parts) > 1 else ''
                actors.append({
                    'name': name,
                    'surname': surname,
                    'popularity': 0  # Placeholder value
                })
        film['actors'] = actors

        # Yield the final JSON structure for the film.
        yield {'film': film}

    def parse_money(self, text_list):
        """Parse text list to extract a monetary value as an integer."""
        text = " ".join(text_list).strip()
        match = re.search(r'\$([\d,]+)', text)
        if match:
            money_str = match.group(1).replace(',', '')
            try:
                return int(money_str)
            except ValueError:
                return None
        return None

    def extract_awards(self, awards_text):
        """
        Given a text such as "Won 3 Oscars. Another 5 wins & 10 nominations.",
        extract the number of awards and nominations.
        """
        num_awards = 0
        num_nominations = 0
        if awards_text:
            wins = re.search(r'(\d+)\s+wins?', awards_text)
            nominations = re.search(r'(\d+)\s+nominations?', awards_text)
            if wins:
                num_awards = int(wins.group(1))
            if nominations:
                num_nominations = int(nominations.group(1))
        return num_awards, num_nominations
