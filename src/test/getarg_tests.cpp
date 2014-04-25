#include <boost/algorithm/string.hpp>
#include <boost/foreach.hpp>
#include <boost/test/unit_test.hpp>

#include "util.h"

BOOST_AUTO_TEST_SUITE(getarg_tests)

static void
ResetArgs(const std::string& strArg)
{
    std::vector<std::string> vecArg;
    boost::split(vecArg, strArg, boost::is_space(), boost::token_compress_on);

    // Insert dummy executable name:
    vecArg.insert(vecArg.begin(), "testbitcoin");

    // Convert to char*:
    std::vector<const char*> vecChar;
    BOOST_FOREACH(std::string& s, vecArg)
        vecChar.push_back(s.c_str());

    ParseParameters(vecChar.size(), &vecChar[0]);
}

BOOST_AUTO_TEST_CASE(boolarg)
{
    ResetArgs("-BAR");
    BOOST_CHECK(GetBoolArg("-BAR"));
    BOOST_CHECK(GetBoolArg("-BAR", false));
    BOOST_CHECK(GetBoolArg("-BAR", true));

    BOOST_CHECK(!GetBoolArg("-fo"));
    BOOST_CHECK(!GetBoolArg("-fo", false));
    BOOST_CHECK(GetBoolArg("-fo", true));

    BOOST_CHECK(!GetBoolArg("-BARo"));
    BOOST_CHECK(!GetBoolArg("-BARo", false));
    BOOST_CHECK(GetBoolArg("-BARo", true));

    ResetArgs("-BAR=0");
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", false));
    BOOST_CHECK(!GetBoolArg("-BAR", true));

    ResetArgs("-BAR=1");
    BOOST_CHECK(GetBoolArg("-BAR"));
    BOOST_CHECK(GetBoolArg("-BAR", false));
    BOOST_CHECK(GetBoolArg("-BAR", true));

    // New 0.6 feature: auto-map -nosomething to !-something:
    ResetArgs("-noBAR");
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", false));
    BOOST_CHECK(!GetBoolArg("-BAR", true));

    ResetArgs("-noBAR=1");
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", false));
    BOOST_CHECK(!GetBoolArg("-BAR", true));

    ResetArgs("-BAR -noBAR");  // -BAR should win
    BOOST_CHECK(GetBoolArg("-BAR"));
    BOOST_CHECK(GetBoolArg("-BAR", false));
    BOOST_CHECK(GetBoolArg("-BAR", true));

    ResetArgs("-BAR=1 -noBAR=1");  // -BAR should win
    BOOST_CHECK(GetBoolArg("-BAR"));
    BOOST_CHECK(GetBoolArg("-BAR", false));
    BOOST_CHECK(GetBoolArg("-BAR", true));

    ResetArgs("-BAR=0 -noBAR=0");  // -BAR should win
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", false));
    BOOST_CHECK(!GetBoolArg("-BAR", true));

    // New 0.6 feature: treat -- same as -:
    ResetArgs("--BAR=1");
    BOOST_CHECK(GetBoolArg("-BAR"));
    BOOST_CHECK(GetBoolArg("-BAR", false));
    BOOST_CHECK(GetBoolArg("-BAR", true));

    ResetArgs("--noBAR=1");
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", false));
    BOOST_CHECK(!GetBoolArg("-BAR", true));

}

BOOST_AUTO_TEST_CASE(stringarg)
{
    ResetArgs("");
    BOOST_CHECK_EQUAL(GetArg("-BAR", ""), "");
    BOOST_CHECK_EQUAL(GetArg("-BAR", "eleven"), "eleven");

    ResetArgs("-BAR -bar");
    BOOST_CHECK_EQUAL(GetArg("-BAR", ""), "");
    BOOST_CHECK_EQUAL(GetArg("-BAR", "eleven"), "");

    ResetArgs("-BAR=");
    BOOST_CHECK_EQUAL(GetArg("-BAR", ""), "");
    BOOST_CHECK_EQUAL(GetArg("-BAR", "eleven"), "");

    ResetArgs("-BAR=11");
    BOOST_CHECK_EQUAL(GetArg("-BAR", ""), "11");
    BOOST_CHECK_EQUAL(GetArg("-BAR", "eleven"), "11");

    ResetArgs("-BAR=eleven");
    BOOST_CHECK_EQUAL(GetArg("-BAR", ""), "eleven");
    BOOST_CHECK_EQUAL(GetArg("-BAR", "eleven"), "eleven");

}

BOOST_AUTO_TEST_CASE(intarg)
{
    ResetArgs("");
    BOOST_CHECK_EQUAL(GetArg("-BAR", 11), 11);
    BOOST_CHECK_EQUAL(GetArg("-BAR", 0), 0);

    ResetArgs("-BAR -bar");
    BOOST_CHECK_EQUAL(GetArg("-BAR", 11), 0);
    BOOST_CHECK_EQUAL(GetArg("-bar", 11), 0);

    ResetArgs("-BAR=11 -bar=12");
    BOOST_CHECK_EQUAL(GetArg("-BAR", 0), 11);
    BOOST_CHECK_EQUAL(GetArg("-bar", 11), 12);

    ResetArgs("-BAR=NaN -bar=NotANumber");
    BOOST_CHECK_EQUAL(GetArg("-BAR", 1), 0);
    BOOST_CHECK_EQUAL(GetArg("-bar", 11), 0);
}

BOOST_AUTO_TEST_CASE(doubledash)
{
    ResetArgs("--BAR");
    BOOST_CHECK_EQUAL(GetBoolArg("-BAR"), true);

    ResetArgs("--BAR=verbose --bar=1");
    BOOST_CHECK_EQUAL(GetArg("-BAR", ""), "verbose");
    BOOST_CHECK_EQUAL(GetArg("-bar", 0), 1);
}

BOOST_AUTO_TEST_CASE(boolargno)
{
    ResetArgs("-noBAR");
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", true));
    BOOST_CHECK(!GetBoolArg("-BAR", false));

    ResetArgs("-noBAR=1");
    BOOST_CHECK(!GetBoolArg("-BAR"));
    BOOST_CHECK(!GetBoolArg("-BAR", true));
    BOOST_CHECK(!GetBoolArg("-BAR", false));

    ResetArgs("-noBAR=0");
    BOOST_CHECK(GetBoolArg("-BAR"));
    BOOST_CHECK(GetBoolArg("-BAR", true));
    BOOST_CHECK(GetBoolArg("-BAR", false));

    ResetArgs("-BAR --noBAR");
    BOOST_CHECK(GetBoolArg("-BAR"));

    ResetArgs("-noBAR -BAR"); // BAR always wins:
    BOOST_CHECK(GetBoolArg("-BAR"));
}

BOOST_AUTO_TEST_SUITE_END()
