export const metadata = { title: "Rules · Survivor Fantasy" };

export default function Rules() {
  return (
    <div className="rules">
      <h1>Rules</h1>
      <p className="muted">How the league works and how every point is scored. Score breakdowns link to the rule behind each line.</p>

      <section className="card">
        <h2 id="basics" style={{ marginTop: 0 }}>The basics</h2>
        <ul>
          <li><strong>When it starts:</strong> at the merge. The first episode after the merge is Week 1.</li>
          <li><strong>Your team:</strong> pick 3 castaways from the merged tribe and rank them 1 to 3, favorite first. It isn't a draft, so several people can have the same castaway. Your ranking only matters as a tiebreaker.</li>
          <li><strong>Team deadline:</strong> teams lock at the Week 1 pick deadline.</li>
          <li><strong>What counts as a week:</strong> each challenge and tribal where someone goes home. An episode with a double tribal is still one week, with two votes.</li>
        </ul>
      </section>

      <section className="card">
        <h2 id="scoring" style={{ marginTop: 0 }}>Scoring each week</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>What happened</th><th className="num">Points</th><th>Who gets them</th></tr></thead>
            <tbody>
              <tr id="survival"><td>Survival: week number × your castaways still in after that week's vote</td><td className="num">week × n</td><td>You</td></tr>
              <tr id="immunity"><td>Individual immunity, winner</td><td className="num">+10</td><td>Anyone with that castaway</td></tr>
              <tr><td>Individual immunity, runner-up</td><td className="num">+5</td><td>Anyone with that castaway</td></tr>
              <tr id="advantages"><td>Advantage found (after the merge)</td><td className="num">+5</td><td>Anyone with that castaway</td></tr>
              <tr><td>Advantage or idol played</td><td className="num">+5</td><td>Anyone with that castaway</td></tr>
              <tr><td>Goes home holding an advantage (each one)</td><td className="num">−5</td><td>Anyone with that castaway</td></tr>
              <tr id="got-votes"><td><strong>New this season:</strong> gets votes at tribal but doesn't go home</td><td className="num">+5</td><td>Anyone with that castaway</td></tr>
              <tr id="weekly-pick"><td>Your weekly pick is voted out</td><td className="num">+10</td><td>You</td></tr>
              <tr><td>Your weekly pick got the second-most votes</td><td className="num">+5</td><td>You</td></tr>
              <tr id="quit-medevac"><td>Castaway quits (on top of −5 per advantage held)</td><td className="num">−5</td><td>Anyone with that castaway</td></tr>
              <tr id="finale"><td>Finale: winner / second / third place</td><td className="num">+30 / +20 / +10</td><td>Anyone with that castaway</td></tr>
              <tr><td>Finale: wins fire-making</td><td className="num">+10</td><td>Anyone with that castaway</td></tr>
            </tbody>
          </table>
        </div>
        <p>Survival is the big one late in the game: in Week 8 each castaway still in is worth 8 points. A castaway voted out that week gets no survival points for the week, but their other points that week still count.</p>
        <p><strong>Immunity runner-up</strong> is usually the second-to-last person standing. When a challenge has two winners (say one man and one woman), the one who lasted longer gets +10 and the other +5. In an all-or-nothing challenge with no clear second place (a puzzle, say), only the winner scores.</p>
        <p><strong>Advantages:</strong> a play counts even if it doesn't change the outcome. It doesn't count if the play is disallowed or forced (like an advantage that must be used at the next challenge). Advantages found before the merge don't earn "found" points, but playing one after the merge still earns the +5.</p>
        <p><strong>Got votes:</strong> +5 for each of your castaways who gets at least one vote and stays. Votes cancelled by an idol still count.</p>
      </section>

      <section className="card">
        <h2 id="pick" style={{ marginTop: 0 }}>The weekly "who goes home" pick</h2>
        <ul>
          <li>Each week, pick the castaway you think will be voted out.</li>
          <li><strong>Deadline: midnight Wednesday, Pacific time.</strong> You can change your pick until then. Everyone's picks show after the deadline. Late picks are flagged for Jack.</li>
          <li>+10 if your pick is voted out. +5 if your pick got the second-most votes. Votes against someone wearing immunity don't count.</li>
          <li>Pick points only count when someone is <strong>voted out</strong>. A quit or medevac doesn't score for anyone's pick.</li>
          <li>In a double tribal week you get two picks, one per tribal. This is rare, since we usually don't know ahead of time.</li>
          <li>If two people leave in the same week, a pick of either one scores +10. A blank pick scores 0.</li>
        </ul>
      </section>

      <section className="card">
        <h2 id="swap" style={{ marginTop: 0 }}>Your one swap</h2>
        <ul>
          <li>Once per season you can replace one castaway on your team, any time before the Week 5 deadline.</li>
          <li>You can drop someone already out or someone still playing, and add anyone still in the game (even someone others have).</li>
          <li>The new castaway scores from Week 5 on, and takes the dropped castaway's spot in your ranking.</li>
        </ul>
      </section>

      <section className="card">
        <h2 id="end" style={{ marginTop: 0 }}>End of season</h2>
        <ul>
          <li>The finale has no survival points. Instead: +30 for the winner, +20 for second, +10 for third, +10 for winning fire-making, plus the usual immunity points.</li>
          <li>Highest total across all weeks wins.</li>
          <li><strong>Quit:</strong> −5 for the quit, plus −5 for each advantage they held. <strong>Medevac:</strong> no penalty.</li>
          <li id="tiebreaker"><strong>Tiebreaker:</strong> whoever ranked the winner higher on their team wins the tie. If nobody had the winner, use the runner-up, then third, and so on. If still level, it's a tie.</li>
        </ul>
      </section>
    </div>
  );
}
