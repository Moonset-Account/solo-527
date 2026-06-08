using System.Collections.Generic;

namespace LakeNavigation
{
    public static class DefaultEntries
    {
        public static List<CollectibleEntry> GetAll()
        {
            return new List<CollectibleEntry>
            {
                new CollectibleEntry
                {
                    Id = "great_heron", DisplayName = "Great Heron",
                    Description = "A tall wading bird commonly spotted along the lake shore.",
                    Category = CollectionCategory.Bird, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Great herons can stand perfectly still for over an hour while hunting fish."
                },
                new CollectibleEntry
                {
                    Id = "kingfisher", DisplayName = "Kingfisher",
                    Description = "A small vividly colored bird that dives into water to catch fish.",
                    Category = CollectionCategory.Bird, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Kingfishers can plunge into water at speeds up to 25 mph."
                },
                new CollectibleEntry
                {
                    Id = "swan", DisplayName = "Mute Swan",
                    Description = "An elegant white waterbird that glides gracefully across the lake.",
                    Category = CollectionCategory.Bird, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Mute swans are not actually mute—they just make far quieter sounds than other swans."
                },
                new CollectibleEntry
                {
                    Id = "eagle", DisplayName = "Golden Eagle",
                    Description = "A large raptor that soars high above the lake searching for prey.",
                    Category = CollectionCategory.Bird, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Golden eagles can spot a rabbit from over two miles away."
                },
                new CollectibleEntry
                {
                    Id = "trout", DisplayName = "Lake Trout",
                    Description = "A prized freshwater fish dwelling in the cool depths of the lake.",
                    Category = CollectionCategory.Fish, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Lake trout can live for over 25 years in cold northern lakes."
                },
                new CollectibleEntry
                {
                    Id = "carp", DisplayName = "Common Carp",
                    Description = "A large resilient fish often found near the lake bottom.",
                    Category = CollectionCategory.Fish, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Common carp were originally domesticated in ancient Rome."
                },
                new CollectibleEntry
                {
                    Id = "perch", DisplayName = "Yellow Perch",
                    Description = "A small striped fish that travels in schools near weed beds.",
                    Category = CollectionCategory.Fish, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Yellow perch eggs are laid in long ribbons that can stretch several feet."
                },
                new CollectibleEntry
                {
                    Id = "otter", DisplayName = "River Otter",
                    Description = "A playful semi-aquatic mammal frequently seen sliding along muddy banks.",
                    Category = CollectionCategory.Mammal, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "River otters can hold their breath underwater for up to eight minutes."
                },
                new CollectibleEntry
                {
                    Id = "deer", DisplayName = "White-tailed Deer",
                    Description = "A graceful herbivore that comes to the lakeshore to drink at dusk.",
                    Category = CollectionCategory.Mammal, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "White-tailed deer can sprint at speeds up to 30 mph."
                },
                new CollectibleEntry
                {
                    Id = "beaver", DisplayName = "North American Beaver",
                    Description = "A industrious rodent known for building dams along lake inlets.",
                    Category = CollectionCategory.Mammal, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Beaver teeth never stop growing, so they must gnaw on wood constantly to wear them down."
                },
                new CollectibleEntry
                {
                    Id = "lily", DisplayName = "Water Lily",
                    Description = "A floating aquatic plant with broad green pads and fragrant white blossoms.",
                    Category = CollectionCategory.Plant, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Water lily pads can support the weight of a small frog resting on them."
                },
                new CollectibleEntry
                {
                    Id = "cattail", DisplayName = "Cattail",
                    Description = "A tall reed-like plant with distinctive brown cigar-shaped flower spikes.",
                    Category = CollectionCategory.Plant, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Every part of the cattail is edible and it has been called the supermarket of the swamp."
                },
                new CollectibleEntry
                {
                    Id = "lotus", DisplayName = "Sacred Lotus",
                    Description = "A rare aquatic flower with pink petals rising above the water surface.",
                    Category = CollectionCategory.Plant, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Lotus seeds can remain viable for over a thousand years."
                },
                new CollectibleEntry
                {
                    Id = "lighthouse", DisplayName = "Old Lighthouse",
                    Description = "A weathered stone lighthouse standing on the eastern promontory.",
                    Category = CollectionCategory.Landmark, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "The lighthouse beam can be seen from over 15 miles across the water."
                },
                new CollectibleEntry
                {
                    Id = "ruins", DisplayName = "Lake Ruins",
                    Description = "Crumbling stone walls of an old settlement half-submerged at the north shore.",
                    Category = CollectionCategory.Landmark, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Local legends say the ruins were once a thriving fishing village from the 1800s."
                },
                new CollectibleEntry
                {
                    Id = "bridge", DisplayName = "Stone Bridge",
                    Description = "An arched stone bridge crossing a narrow strait in the southern lake.",
                    Category = CollectionCategory.Landmark, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "The bridge was built without mortar and relies entirely on precisely cut stone."
                },
                new CollectibleEntry
                {
                    Id = "waterfall", DisplayName = "Hidden Waterfall",
                    Description = "A secluded waterfall tucked behind dense forest on the western shore.",
                    Category = CollectionCategory.Landmark, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "The waterfall is only visible from the lake and cannot be reached by land trails."
                },
                new CollectibleEntry
                {
                    Id = "fog_bank", DisplayName = "Dense Fog Bank",
                    Description = "A thick wall of fog that rolls across the lake reducing visibility to near zero.",
                    Category = CollectionCategory.WeatherEvent, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Lake fog can form in minutes when warm air meets cold water."
                },
                new CollectibleEntry
                {
                    Id = "thunderstorm", DisplayName = "Thunderstorm",
                    Description = "A dramatic storm with lightning striking the lake surface and heavy rain.",
                    Category = CollectionCategory.WeatherEvent, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Lightning strikes the surface of large lakes thousands of times each year."
                },
                new CollectibleEntry
                {
                    Id = "rainbow", DisplayName = "Rainbow",
                    Description = "A vivid arc of colors appearing over the lake after a passing shower.",
                    Category = CollectionCategory.WeatherEvent, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "From a boat on the lake you can sometimes see a full circular rainbow."
                },
                new CollectibleEntry
                {
                    Id = "waterspout", DisplayName = "Waterspout",
                    Description = "A rotating column of water mist rising from the lake surface during storms.",
                    Category = CollectionCategory.WeatherEvent, IsDiscovered = false, DiscoveryCount = 0,
                    FunFact = "Most waterspouts are weaker than tornadoes but can still cap small boats."
                }
            };
        }
    }
}
