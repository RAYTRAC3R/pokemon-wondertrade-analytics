var _ = require('underscore'),
    rest = require('restler'),
    parseString = require('xml2js').parseString,
	HighChartsData = require('../models/HighChartsData').model,
	PokemonList = require('../data/pokemonList.json'),
	CountryList = require('../data/countryList.json'),
	UserTableModel = require('../models/UserTable').model,
    RedditPostModel = require('../models/RedditPost').model,
	PokemonHash = {},
	CountryHash = {};

for(var pokemon in PokemonList) {
		PokemonHash[PokemonList[pokemon].id] = PokemonList[pokemon].name;
	}

for(var country in CountryList) {
	CountryHash[CountryList[country].id] = CountryList[country].name;
}



exports.initController = function(app, dataStore) {

    function OverviewPage(request, response){
        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result);

            response.render('data/index', {
                title: 'Wonder Trade Analytics',
                pageState: '',
                result: result,
                PokemonHash: PokemonHash,
                CountryHash: CountryHash,
                user: request.user,
                pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon()),
                genderChart: JSON.stringify(highChartsData.getCountsByGender()),
                countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries())
            });
        });
    }

    function PokemonPage(request, response){
        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                pokemonTable = highChartsData.getPokemonTable(),
                topTenPokemon = highChartsData.getTopTenPokemon(),
                topTenPokemonIds = _.map(topTenPokemon, function(pkmn){return pkmn[0]});

            pokemonTable.reverse();

            response.render('data/pokemon', {
                title: 'Wonder Trade Pokemon Analytics',
                pageState: '',
                result: result,
                PokemonHash: PokemonHash,
                trendingPokemonChart: JSON.stringify(highChartsData.getCountTrendsByPokemon(false, topTenPokemonIds)),
                levelBarChart: JSON.stringify(highChartsData.getCountsByLevels()),
                topTenPokemon: topTenPokemon,
                pokemonList: PokemonList,
                user: request.user,
                pokemonTable: pokemonTable,
                pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon()),
                quickstats: highChartsData.getQuickStats()
            });
        });
    }

    function PokemonByIdPage(request, response){
        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var pokemonId = request.params.pokemonId,
                highChartsData = new HighChartsData(result),
                highChartsDataByPokemonId = highChartsData.getResultsByPokemonId(pokemonId),
                nicknames = highChartsData.getNicknamesByResultSet(highChartsDataByPokemonId),
                pokemonName = PokemonHash[pokemonId];

            response.render('data/pokemonById', {
                title: pokemonName+' Analytics',
                pageState: '',
                result: result,
                pokemonName: pokemonName,
                pokemonId: pokemonId,
                user: request.user,
                nicknames: nicknames,
                trendingPokemonChart: JSON.stringify(highChartsData.getCountTrendsByPokemon(highChartsDataByPokemonId)),
                levelBarChart: JSON.stringify(highChartsData.getCountsByLevels(highChartsDataByPokemonId)),
                genderChart: JSON.stringify(highChartsData.getCountsByGender(highChartsDataByPokemonId)),
                countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataByPokemonId)),
                quickstats: highChartsData.getQuickStats(highChartsDataByPokemonId)
            });
        });
    }

    function RegionsPage(request, response){
        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                regionsTable = highChartsData.getRegionsTable();

            regionsTable.reverse();

            response.render('data/regions', {
                title: 'Wonder Trade Region Analytics',
                pageState: '',
                regionsTable: regionsTable,
                user: request.user,
                totalCount: result.length,
                countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries())
            });
        });
    }

    function RegionByIdPage(request, response){
        dataStore.lrange('wondertrade' ,0, -1, function(error, result){

            var regionId = request.params.regionCode,
                highChartsData = new HighChartsData(result),
                highChartsDataByRegionId = highChartsData.getResultsByRegionId(regionId),
                regionName = CountryHash[regionId];

            response.render('data/regionById', {
                title: regionName+' Analytics',
                pageState: '',
                regionName: regionName,
                genderChart: JSON.stringify(highChartsData.getCountsByGender(highChartsDataByRegionId)),
                pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataByRegionId)),
                subregionChart: JSON.stringify(highChartsData.getCountsBySubRegions(highChartsDataByRegionId)),
                quickstats: highChartsData.getQuickStats(highChartsDataByRegionId),
                user: request.user
            });
        });
    }

    function NicknamesPage(request, response){

        dataStore.lrange('userTable' , 0, -1, function(error, result){
            var userTable = new UserTableModel(result);

            dataStore.lrange('wondertrade' ,0, -1, function(error, result){
                var highChartsData = new HighChartsData(result),
                    highChartsDataWithNicknames = highChartsData.getNicknamesTable();

                response.render('data/nicknames', {
                    title: 'Nickname Analytics',
                    pageState: '',
                    wondertradeTable: highChartsDataWithNicknames,
                    pokemonHash: PokemonHash,
                    userTable: userTable,
                    user: request.user
                });
            });

        });
    }

    function HiddenAbilitiesPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                highChartsDataWithHiddenAbilities = highChartsData.getResultsWithHiddenAbilities(),
                pokemonTable = highChartsData.getPokemonTable(highChartsDataWithHiddenAbilities);


            pokemonTable.reverse();

            response.render('data/hiddenAbilities', {
                title: 'Pokemon with Hidden Abilities',
                pageState: '',
                result: result,
                PokemonHash: PokemonHash,
                levelBarChart: JSON.stringify(highChartsData.getCountsByLevels(highChartsDataWithHiddenAbilities)),
                countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataWithHiddenAbilities)),
                pokemonList: PokemonList,
                user: request.user,
                pokemonTable: pokemonTable,
                pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataWithHiddenAbilities)),
                quickstats: highChartsData.getQuickStats(highChartsDataWithHiddenAbilities)
            });
        });
    }
    function PerfectIVPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                highChartsDataWithPerfectIV = highChartsData.getResultsWithPerfectIV(),
                pokemonTable = highChartsData.getPokemonTable(highChartsDataWithPerfectIV);


            pokemonTable.reverse();

            response.render('data/perfectIV', {
                title: 'Pokemon with Hidden Abilities',
                pageState: '',
                result: result,
                PokemonHash: PokemonHash,
                levelBarChart: JSON.stringify(highChartsData.getCountsByLevels(highChartsDataWithPerfectIV)),
                countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataWithPerfectIV)),
                pokemonList: PokemonList,
                user: request.user,
                pokemonTable: pokemonTable,
                pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataWithPerfectIV)),
                quickstats: highChartsData.getQuickStats(highChartsDataWithPerfectIV)
            });
        });
    }

    function GenderPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                maleResults = highChartsData.getResultsByGender('male'),
                femaleResults = highChartsData.getResultsByGender('female'),
                maleSortedSet = highChartsData.getSortedCountsByPokemon(maleResults),
                femaleSortedSet = highChartsData.getSortedCountsByPokemon(femaleResults);

            maleSortedSet = maleSortedSet.reverse();
            maleSortedSet =  _.first(maleSortedSet,10);

            femaleSortedSet = femaleSortedSet.reverse();
            femaleSortedSet =  _.first(femaleSortedSet,10);


            response.render('data/gender', {
                title: 'Wonder Trade Analytics',
                pageState: '',
                result: result,
                PokemonHash: PokemonHash,
                maleQuickstats: highChartsData.getQuickStats(maleResults),
                femaleQuickstats: highChartsData.getQuickStats(femaleResults),
                user: request.user,
                malePokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(maleResults)),
                maleCountryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(maleResults)),
                maleTopTenPokemon: maleSortedSet,
                femalePokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(femaleResults)),
                femaleCountryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(femaleResults)),
                femaleTopTenPokemon: femaleSortedSet
            });
        });

    }

    function LevelsPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result);

            response.render('data/levels', {
                title: 'Level Analytics',
                pageState: '',
                result: result,
                PokemonHash: PokemonHash,
                CountryHash: CountryHash,
                user: request.user,
                levelBarChart: JSON.stringify(highChartsData.getCountsByLevels()),
            });
        });

    }

    function LevelPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var pokemonLevel = request.params.pokemonLevel,
                highChartsData = new HighChartsData(result),
                highChartsDataByLevel = highChartsData.getResultsByPokemonLevel(pokemonLevel),
                integerPokemonLevel = parseInt(pokemonLevel, 10);

            response.render('data/byLevel', {
                title: 'Level '+integerPokemonLevel+' Analytics',
                pageState: '',
                result: result,
                pokemonLevel: integerPokemonLevel,
                user: request.user,
                pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataByLevel)),
                genderChart: JSON.stringify(highChartsData.getCountsByGender(highChartsDataByLevel)),
                countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataByLevel)),
                quickstats: highChartsData.getQuickStats(highChartsDataByLevel)
            });
        });

    }

    function DatesPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                statTrendsByDate = highChartsData.getQuickStatsTrendsByDates();

            response.render('data/dates', {
                title: 'Wonder Trade Analytics',
                pageState: '',
                user: request.user,
                stateMessage: '',
                quickStatTrends: JSON.stringify(statTrendsByDate)
            });
        });
    }

    function DatePage(request, response){
        dataStore.lrange('userTable' , 0, -1, function(error, result){
            var userTable = new UserTableModel(result);

            dataStore.lrange('wondertrade' ,0, -1, function(error, result){
                var userId = request.params.userId,
                    submissionDate = request.params.submissionDate,
                    highChartsData = new HighChartsData(result),
                    highChartsDataBySubmissionDate = highChartsData.getResultsBySubmissionDate(submissionDate),
                    pokemonTable = highChartsData.getPokemonTable(highChartsDataBySubmissionDate),
                    userChart = highChartsData.getCountsByUserIdAndUserTableFormatted(highChartsDataBySubmissionDate, userTable);

                pokemonTable.reverse();

                response.render('data/datesByDay', {
                    title: ' Analytics for '+submissionDate,
                    pageState: '',
                    user: request.user,
                    submissionDate: submissionDate,
                    userChart: JSON.stringify(userChart),
                    wondertradeTends: JSON.stringify(highChartsData.getTrendsByDate(highChartsDataBySubmissionDate)),
                    pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataBySubmissionDate)),
                    genderChart: JSON.stringify(highChartsData.getCountsByGender(highChartsDataBySubmissionDate)),
                    pokemonTable: pokemonTable,
                    quickstats: highChartsData.getQuickStats(highChartsDataBySubmissionDate),
                    countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataBySubmissionDate))
                });
            });

        });
    }

    function LikesPage(request, response){

        dataStore.lrange('wondertrade' ,0, -1, function(error, result){
            var highChartsData = new HighChartsData(result),
                pokemonLikenessList = highChartsData.getCommunityLikes();


            response.render('data/likes', {
                title: 'Wonder Trade Sentiment',
                pageState: '',
                user: request.user,
                pokemonLikenessList: pokemonLikenessList
            });
        });
    }

    function UserIdPage(request, response){

        var userId = request.params.userId;

        dataStore.lrange('redditUser' , 0, -1, function(error, result){
            var redditUserName = '';
            for(var user in result) {
                var parsedUser = JSON.parse(result[user]);
                if(parsedUser.userId == userId) {
                    redditUserName = parsedUser.redditUserName;
                }
            }

            dataStore.lrange('userTable' , 0, -1, function(error, result){
                var userTable = new UserTableModel(result);

                dataStore.lrange('wondertrade' ,0, -1, function(error, result){
                    var highChartsData = new HighChartsData(result),
                        highChartsDataByUserId = highChartsData.getResultsByUserId(userId),
                        pokemonTable = highChartsData.getPokemonTable(highChartsDataByUserId),
                        trendsByDate = highChartsData.getTrendsByDate(highChartsDataByUserId),
                        submissionDates = highChartsData.getSubmissionDates(highChartsDataByUserId),
                        userName = userTable[userId];

                    pokemonTable.reverse();

                    var mav = {
                        title: ' Analytics for '+userName,
                        pageState: '',
                        user: request.user,
                        username: userName,
                        userId: userId,
                        wondertradeTends: JSON.stringify(trendsByDate),
                        submissionDates: submissionDates,
                        pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataByUserId)),
                        genderChart: JSON.stringify(highChartsData.getCountsByGender(highChartsDataByUserId)),
                        pokemonTable: pokemonTable,
                        quickstats: highChartsData.getQuickStats(highChartsDataByUserId),
                        countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataByUserId)),
                        redditResults: false
                    };

                    if (redditUserName && redditUserName != '') {
                        rest.get('http://www.reddit.com/r/WonderTrade/search.rss?q=subreddit%3Awondertrade+author%3A'+redditUserName).on('complete', function(data) {
                            parseString(data, function (err, result) {

                                if(result && result.rss && result.rss.channel && result.rss.channel[0]) {
                                    var redditPosts = [];
                                    for(var item in result.rss.channel[0].item) {
                                        var redditItem = result.rss.channel[0].item[item];
                                        if(redditItem) {
                                            var redditPost = new RedditPostModel(redditItem);
                                            redditPosts.push(redditPost);
                                        }
                                    }
                                    mav.redditResults = redditPosts;
                                }
                                response.render('data/user', mav);

                            });
                        });
                    } else {
                        response.render('data/user', mav);
                    }
                });

            });
        });
    }

    function UserIdDatePage(request, response){

        dataStore.lrange('userTable' , 0, -1, function(error, result){
            var userTable = new UserTableModel(result);

            dataStore.lrange('wondertrade' ,0, -1, function(error, result){
                var userId = request.params.userId,
                    submissionDate = request.params.submissionDate,
                    highChartsData = new HighChartsData(result),
                    highChartsDataByUserId = highChartsData.getResultsByUserIdAndSubmissionDate(userId, submissionDate),
                    pokemonTable = highChartsData.getPokemonTable(highChartsDataByUserId),
                    userName = userTable[userId];

                pokemonTable.reverse();

                response.render('data/userDate', {
                    title: ' Analytics for '+userName,
                    pageState: '',
                    user: request.user,
                    username: userName,
                    submissionDate: submissionDate,
                    wondertradeTends: JSON.stringify(highChartsData.getTrendsByDate(highChartsDataByUserId)),
                    pokemonChart: JSON.stringify(highChartsData.getSortedCountsByPokemon(highChartsDataByUserId)),
                    genderChart: JSON.stringify(highChartsData.getCountsByGender(highChartsDataByUserId)),
                    pokemonTable: pokemonTable,
                    quickstats: highChartsData.getQuickStats(highChartsDataByUserId),
                    countryChart: JSON.stringify(highChartsData.getSortedCountsByCountries(highChartsDataByUserId))
                });
            });

        });
    }

	app.get('/data', OverviewPage);
	app.get('/data/pokemon', PokemonPage);
	app.get('/data/pokemon/:pokemonId', PokemonByIdPage);
	app.get('/data/regions', RegionsPage);
	app.get('/data/regions/:regionCode', RegionByIdPage);
	app.get('/data/nicknames', NicknamesPage);
    app.get('/data/hiddenAbilities', HiddenAbilitiesPage);
	app.get('/data/perfectIV', PerfectIVPage);
	app.get('/data/gender', GenderPage);
	app.get('/data/levels', LevelsPage);
	app.get('/data/levels/:pokemonLevel', LevelPage);
	app.get('/data/dates', DatesPage);
	app.get('/data/dates/:submissionDate', DatePage);
    app.get('/data/likes', LikesPage);
	app.get('/users/:userId', UserIdPage);
	app.get('/users/:userId/date/:submissionDate', UserIdDatePage);

};
