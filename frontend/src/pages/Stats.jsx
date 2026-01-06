import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";
import formatDate from "../utils/formatDate";

export default function Stats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  async function loadStats() {
    try {
      const res = await axiosClient.get("/entries/stats");
      setStats(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login");
      }
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (!stats) return <Page title="Stats"><Nav />Loading…</Page>;

  return (
    <Page title="Stats" subtitle="Mood overview">
      <Nav />

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <div>Total entries</div>
          <div className="text-2xl font-semibold">
            {stats.totalEntries}
          </div>
        </Card>

        <Card>
          <div>Average mood</div>
          <div className="text-2xl font-semibold">
            {stats.averageMood}/5
          </div>
        </Card>

        <Card>
          <div>Best day</div>
          {stats.bestDay && (
            <div>
              {formatDate(stats.bestDay.entry_date)} —{" "}
              {stats.bestDay.mood}/5
            </div>
          )}
        </Card>

        <Card>
          <div>Worst day</div>
          {stats.worstDay && (
            <div>
              {formatDate(stats.worstDay.entry_date)} —{" "}
              {stats.worstDay.mood}/5
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
