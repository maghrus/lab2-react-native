import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

import rawLanguages from "./data/languages.json";

//încă nu am înțeles de ce nu o ia ca pe react în browser(cu importurile de imagini locale), dar va fi clar :)
const imageMap = {
  "./assets/imagini/java.png": require("./assets/imagini/java.png"),
  "./assets/imagini/python.png": require("./assets/imagini/python.png"),
  "./assets/imagini/csharp.png": require("./assets/imagini/csharp.png"),
  "./assets/imagini/cplus.png": require("./assets/imagini/cplus.png"),
  "./assets/imagini/php.png": require("./assets/imagini/php.png"),
  "./assets/imagini/react.png": require("./assets/imagini/react.png"),
  "./assets/imagini/js.png": require("./assets/imagini/js.png"),
  "./assets/imagini/turbo.png": require("./assets/imagini/turbo.png"),
};

const languages = rawLanguages.map((item) => ({
  ...item,
  image: imageMap[item.image],
}));

export default function App() {
  const [username, setUsername] = useState("");
  const [started, setStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [matches, setMatches] = useState(pairArray(languages));
  const [matchIndex, setMatchIndex] = useState(0);
  const [winners, setWinners] = useState([]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadResults();
  }, []);

  function pairArray(arr) {
    const res = [];
    for (let i = 0; i < arr.length; i += 2) {
      res.push(arr.slice(i, i + 2));
    }
    return res;
  }

  const loadResults = async () => {
    const saved = await AsyncStorage.getItem("@results");
    if (saved) setResults(JSON.parse(saved));
  };

  const saveResult = async (winner) => {
    const updated = results.filter((r) => r.username !== username);
    updated.push({ username, winner: winner.name });
    setResults(updated);
    await AsyncStorage.setItem("@results", JSON.stringify(updated));
  };

  const handleSelect = (language) => {
    const newWinners = [...winners, language];
    const pair = matches[matchIndex];
    setHistory([
      ...history,
      { round: currentRound, match: pair, winner: language },
    ]);

    if (matchIndex + 1 < matches.length) {
      setMatchIndex(matchIndex + 1);
      setWinners(newWinners);
    } else {
      if (newWinners.length === 1) {
        saveResult(newWinners[0]);
        setMatches([[newWinners[0]]]);
      } else {
        const nextRound = pairArray(newWinners);
        setMatches(nextRound);
        setCurrentRound(currentRound + 1);
        setMatchIndex(0);
        setWinners([]);
      }
    }
  };

  const restart = () => {
    setStarted(false);
    setUsername("");
    setCurrentRound(1);
    setMatches(pairArray(languages));
    setMatchIndex(0);
    setWinners([]);
    setHistory([]);
  };

  if (!started) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Limbajul favorit</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="Miaw"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => username && setStarted(true)}
        >
          <Text style={styles.buttonText}>Începe</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  //afișarea rezultatelor finale, cu alegerile celorlanți useri
  if (matches.length === 1 && matches[0].length === 1) {
    const winner = matches[0][0];
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
          <StatusBar></StatusBar>
          <Text style={styles.title}>Winner Winner Chicken Dinner</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <Image source={winner.image} style={styles.imageWinner} />

          <Text style={{ fontSize: 18, marginTop: 20 }}>Manșele</Text>
          <Bracket history={history} />
          <View style={styles.results}>
            {results.map((r, i) => (
              <Text key={i}>
                {r.username} → {r.winner}
              </Text>
            ))}
          </View>
          <View style={{ alignItems: "center", paddingVertical: 20, marginTop: 10}}>
            <TouchableOpacity
              style={[styles.button, styles.buttonFinal]}
              onPress={restart}
            >
              <Text style={styles.buttonText}>Hai de la început</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  //runda curentă
  const currentPair = matches[matchIndex];
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Runda {currentRound}</Text>
      <View style={styles.containerDuel}>
        {currentPair.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            style={styles.butonDuel}
            onPress={() => handleSelect(lang)}
          >
            <Image source={lang.image} style={styles.image} />
            <Text style={styles.name}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

//construirea manșelor(etapele prin care s-a trecut până a se ajunge la rezultatul final)
function Bracket({ history }) {
  const rounds = {};
  history.forEach((h) => {
    if (!rounds[h.round]) rounds[h.round] = [];
    rounds[h.round].push(h.match);
  });

  const orderedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => rounds[k]);

  const renderTeam = (team, winnerId) => (
    <View
      style={[
        brStyles.teamRow,
        winnerId === team?.id ? brStyles.winnerHighlight : null,
      ]}
    >
      {team?.image && <Image source={team.image} style={brStyles.teamImg} />}
      <Text numberOfLines={1} style={brStyles.teamName}>
        {team?.name || "—"}
      </Text>
      {winnerId === team?.id && <Text style={brStyles.winnerArrow}>→</Text>}
    </View>
  );

  return (
    <View style={brStyles.container}>
      {orderedRounds.map((roundMatches, colIdx) => (
        <View key={`col-${colIdx}`} style={brStyles.column}>
          <Text style={brStyles.roundTitle}>Runda {colIdx + 1}</Text>
          <View style={brStyles.matchesWrapper}>
            {roundMatches.map((match, mIdx) => {
              const histEntry = history.find(
                (h) =>
                  h.round === colIdx + 1 &&
                  h.match?.length === match.length &&
                  h.match[0].id === match[0].id &&
                  (match[1] ? h.match[1].id === match[1].id : true)
              );

              const winnerId = histEntry?.winner?.id;

              return (
                <View key={`m-${colIdx}-${mIdx}`} style={brStyles.matchCard}>
                  {renderTeam(match[0], winnerId)}
                  <View style={brStyles.smallSeparator} />
                  {renderTeam(match[1], winnerId)}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}


//Da, am folosit chat-ul ca sa fac să arate frumos brackets
const brStyles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "transparent",
  },
  column: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  roundTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  matchesWrapper: {
    width: "100%",
    justifyContent: "space-between",
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 6,
    marginVertical: 6,
    minHeight: 64,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  teamImg: {
    width: 26,
    height: 26,
    borderRadius: 4,
    marginRight: 8,
  },
  teamName: {
    fontSize: 12,
    flexShrink: 1,
  },
  smallSeparator: {
    height: 6,
  },
  winnerHighlight: {
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  winnerArrow: {
    marginLeft: 6,
    color: "#2e86de",
    fontWeight: "700",
  },
  emptyBox: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginVertical: 10,
    fontWeight: "bold",
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    padding: 10,
    width: 200,
    marginVertical: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#243c57ff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonFinal: {
    alignItems: "center",
    width: 150,
    backgroundColor: "#0c6066ff",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  containerDuel: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 30,
  },
  butonDuel: {
    alignItems: "center",
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  imageWinner: {
    width: 200,
    height: 200,
    marginBottom: 20,
    marginTop: 0,
    paddingTop: 0,
    objectFit: "contain",
    alignSelf: "center",
  },
  winnerName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
    marginTop: 30,
  },
  results: {
    marginTop: 10,
    marginBottom: 50,
    maxHeight: 200,
  },
});

