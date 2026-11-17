export interface RepoSnapshot {
  owner: string;
  repo: string;
  branch: string;
  pagesUrl: string;
  repoUrl: string;
  languages: Record<string, number>;
  existingFiles: Array<{
    name: string;
    bytes: number;
    countedByLinguist: boolean;
    language: string;
  }>;
  lastSyncedLabel: string;
}

export interface GeneratedFile {
  id: string;
  path: string;
  title: string;
  summary: string;
  language: 'Python' | 'JSON' | 'Text';
  countedByLinguist: boolean;
  defaultEnabled: boolean;
  content: string;
}

export const INITIAL_REPO_SNAPSHOT: RepoSnapshot = {
  owner: 'tejaswibhoge-tech',
  repo: 'tejaswi-portfolio',
  branch: 'main',
  pagesUrl: 'https://tejaswibhoge-tech.github.io/tejaswi-portfolio/',
  repoUrl: 'https://github.com/tejaswibhoge-tech/tejaswi-portfolio',
  languages: {
    HTML: 6406,
    JavaScript: 341,
  },
  existingFiles: [
    { name: 'index.html', bytes: 6406, countedByLinguist: true, language: 'HTML' },
    { name: 'script.js', bytes: 341, countedByLinguist: true, language: 'JavaScript' },
    { name: 'style.css', bytes: 8607, countedByLinguist: false, language: 'CSS (ignored by Linguist)' },
    { name: 'README.md', bytes: 919, countedByLinguist: false, language: 'Markdown (prose)' },
    { name: 'introduction-to-discrete-mathematics.pdf', bytes: 462582, countedByLinguist: false, language: 'PDF (binary)' },
    { name: 'wolfram-level-1-discrete-mathematics.pdf', bytes: 441783, countedByLinguist: false, language: 'PDF (binary)' },
  ],
  lastSyncedLabel: 'Snapshot from GitHub API',
};

export const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  HTML: '#E34C26',
  JavaScript: '#F1E05A',
  CSS: '#563D7C',
  TypeScript: '#3178C6',
  Other: '#94A3B8',
};

export const INITIAL_GENERATED_FILES: GeneratedFile[] = [
  {
    id: 'generate_portfolio',
    path: 'generate_portfolio.py',
    title: 'Portfolio Static Site Builder',
    summary: 'Reads portfolio_data.json, validates certificate links and projects, and renders or checks index.html for GitHub Pages.',
    language: 'Python',
    countedByLinguist: true,
    defaultEnabled: true,
    content: `"""Static portfolio validator and HTML generator for Bhoge Tejaswi."""

from __future__ import annotations

import html
import json
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent
DATA_FILE = ROOT_DIR / "portfolio_data.json"
INDEX_FILE = ROOT_DIR / "index.html"


def load_portfolio_data(path: Path = DATA_FILE) -> dict[str, Any]:
    """Load structured portfolio metadata from JSON."""
    if not path.exists():
        raise FileNotFoundError(f"Portfolio data file not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_certificates(certificates: list[dict[str, str]]) -> list[str]:
    """Verify every referenced certificate PDF exists in the repository root."""
    missing: list[str] = []
    for cert in certificates:
        pdf_name = cert.get("file", "")
        if pdf_name and not (ROOT_DIR / pdf_name).exists():
            missing.append(pdf_name)
    return missing


def render_skill_cards(skills: list[dict[str, Any]]) -> str:
    """Render HTML article blocks for each skill category."""
    blocks: list[str] = []
    for category in skills:
        tags = "".join(f"<span>{html.escape(item)}</span>" for item in category["items"])
        blocks.append(
            "<article>"
            f"<b>{html.escape(category['symbol'])}</b>"
            f"<h3>{html.escape(category['title'])}</h3>"
            f"<p>{html.escape(category['description'])}</p>"
            f'<div class="tags">{tags}</div>'
            "</article>"
        )
    return "".join(blocks)


def render_certificate_cards(certificates: list[dict[str, str]]) -> str:
    """Render Wolfram U and academic certificate blocks."""
    cards: list[str] = []
    for cert in certificates:
        cards.append(
            "<article>"
            '<div class="seal">W<span>U</span></div>'
            "<div>"
            f"<small>{html.escape(cert['issuer'])}</small>"
            f"<h3>{html.escape(cert['title'])}</h3>"
            f"<p>{html.escape(cert['details'])}</p>"
            f'<a href="{html.escape(cert["file"])}" target="_blank" rel="noopener">'
            "View certificate ↗</a>"
            "</div>"
            "</article>"
        )
    return "".join(cards)


def build_summary_report(data: dict[str, Any]) -> str:
    """Generate a terminal-friendly summary of the portfolio configuration."""
    missing = validate_certificates(data.get("certificates", []))
    lines = [
        f"Portfolio Owner : {data['owner']['name']}",
        f"Location        : {data['owner']['location']}",
        f"Contact Email   : {data['owner']['email']}",
        f"Skills Sections : {len(data.get('skills', []))}",
        f"Projects Listed : {len(data.get('projects', []))}",
        f"Certificates    : {len(data.get('certificates', []))}",
        f"Missing PDFs    : {', '.join(missing) if missing else 'None'}",
    ]
    return "\\n".join(lines)


if __name__ == "__main__":
    portfolio = load_portfolio_data()
    print(build_summary_report(portfolio))
    if INDEX_FILE.exists():
        print(f"Verified live GitHub Pages entry file: {INDEX_FILE.name} ({INDEX_FILE.stat().st_size} bytes)")
`,
  },
  {
    id: 'ai_study_buddy',
    path: 'projects/ai_study_buddy.py',
    title: 'AI Study Buddy Planner (Project 02)',
    summary: 'Working Python implementation of Project 02 from your portfolio: organizes CS subjects, prioritizes sessions, and tracks completion.',
    language: 'Python',
    countedByLinguist: true,
    defaultEnabled: true,
    content: `"""AI Study Buddy: Student productivity and study-session planner."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta


@dataclass
class StudyTopic:
    """Represents a subject topic with difficulty and completion state."""

    subject: str
    title: str
    estimated_minutes: int
    priority: int = 2  # 1 = High, 2 = Medium, 3 = Low
    completed: bool = False


@dataclass
class StudyPlan:
    """Manages daily study sessions for Computer Science coursework."""

    student_name: str = "Bhoge Tejaswi"
    topics: list[StudyTopic] = field(default_factory=list)

    def add_topic(
        self,
        subject: str,
        title: str,
        estimated_minutes: int,
        priority: int = 2,
    ) -> None:
        self.topics.append(
            StudyTopic(
                subject=subject,
                title=title,
                estimated_minutes=estimated_minutes,
                priority=priority,
            )
        )

    def mark_completed(self, title: str) -> bool:
        for topic in self.topics:
            if topic.title.lower() == title.lower():
                topic.completed = True
                return True
        return False

    def completion_rate(self) -> float:
        if not self.topics:
            return 0.0
        done = sum(1 for topic in self.topics if topic.completed)
        return round((done / len(self.topics)) * 100, 1)

    def next_recommended_sessions(self, max_minutes: int = 90) -> list[StudyTopic]:
        """Select highest-priority pending topics that fit within available time."""
        pending = sorted(
            (topic for topic in self.topics if not topic.completed),
            key=lambda item: (item.priority, item.estimated_minutes),
        )
        chosen: list[StudyTopic] = []
        used = 0
        for topic in pending:
            if used + topic.estimated_minutes <= max_minutes:
                chosen.append(topic)
                used += topic.estimated_minutes
        return chosen

    def weekly_schedule(self, start_day: date | None = None) -> dict[str, list[str]]:
        """Distribute pending topics across upcoming days."""
        current_day = start_day or date.today()
        schedule: dict[str, list[str]] = {}
        pending = [t for t in self.topics if not t.completed]
        for index, topic in enumerate(pending):
            day_key = (current_day + timedelta(days=index)).isoformat()
            schedule.setdefault(day_key, []).append(
                f"[{topic.subject}] {topic.title} ({topic.estimated_minutes} min)"
            )
        return schedule


def create_default_plan() -> StudyPlan:
    plan = StudyPlan()
    plan.add_topic("Data Structures", "Linked Lists & Stacks", 45, priority=1)
    plan.add_topic("Discrete Mathematics", "Graph Theory Basics", 40, priority=1)
    plan.add_topic("Python", "File I/O and Dataclasses", 35, priority=2)
    plan.mark_completed("Linked Lists & Stacks")
    return plan


if __name__ == "__main__":
    my_plan = create_default_plan()
    print(f"Study Plan for {my_plan.student_name} — Progress: {my_plan.completion_rate()}%")
    for session in my_plan.next_recommended_sessions():
        print(f"  Next: {session.subject} -> {session.title} ({session.estimated_minutes}m)")
`,
  },
  {
    id: 'campus_navigator',
    path: 'projects/campus_navigator.py',
    title: 'Smart Campus Navigator (Project 01)',
    summary: 'Working Python Dijkstra graph solver for Project 01: finds the shortest walking path between classrooms, labs, and the library.',
    language: 'Python',
    countedByLinguist: true,
    defaultEnabled: false,
    content: `"""Smart Campus Navigator: Shortest-path graph router for campus facilities."""

from __future__ import annotations

import heapq
from dataclasses import dataclass


@dataclass(frozen=True)
class RouteResult:
    """Shortest walking route between two campus locations."""

    origin: str
    destination: str
    total_meters: int
    stops: list[str]


class CampusGraph:
    """Weighted undirected graph modeling campus buildings and walkways."""

    def __init__(self) -> None:
        self._adjacency: dict[str, list[tuple[str, int]]] = {}

    def add_walkway(self, place_a: str, place_b: str, meters: int) -> None:
        self._adjacency.setdefault(place_a, []).append((place_b, meters))
        self._adjacency.setdefault(place_b, []).append((place_a, meters))

    def list_locations(self) -> list[str]:
        return sorted(self._adjacency.keys())

    def shortest_route(self, origin: str, destination: str) -> RouteResult:
        """Compute the shortest walking route using Dijkstra's algorithm."""
        if origin not in self._adjacency or destination not in self._adjacency:
            raise ValueError(f"Unknown campus location: {origin!r} or {destination!r}")

        distances: dict[str, int] = {origin: 0}
        previous: dict[str, str | None] = {origin: None}
        queue: list[tuple[int, str]] = [(0, origin)]

        while queue:
            current_dist, node = heapq.heappop(queue)
            if node == destination:
                break
            if current_dist > distances.get(node, float("inf")):
                continue

            for neighbor, weight in self._adjacency[node]:
                candidate = current_dist + weight
                if candidate < distances.get(neighbor, float("inf")):
                    distances[neighbor] = candidate
                    previous[neighbor] = node
                    heapq.heappush(queue, (candidate, neighbor))

        if destination not in distances:
            raise ValueError(f"No walking path found from {origin} to {destination}")

        path: list[str] = []
        cursor: str | None = destination
        while cursor is not None:
            path.append(cursor)
            cursor = previous.get(cursor)
        path.reverse()

        return RouteResult(
            origin=origin,
            destination=destination,
            total_meters=distances[destination],
            stops=path,
        )


def build_sample_campus() -> CampusGraph:
    campus = CampusGraph()
    campus.add_walkway("Main Gate", "Central Library", 120)
    campus.add_walkway("Central Library", "CSE Block", 85)
    campus.add_walkway("CSE Block", "Programming Lab", 40)
    campus.add_walkway("Main Gate", "Student Center", 95)
    campus.add_walkway("Student Center", "Programming Lab", 150)
    return campus


if __name__ == "__main__":
    graph = build_sample_campus()
    route = graph.shortest_route("Main Gate", "Programming Lab")
    print(f"Route ({route.total_meters}m): {' -> '.join(route.stops)}")
`,
  },
  {
    id: 'test_portfolio',
    path: 'tests/test_portfolio.py',
    title: 'Portfolio & Project Unit Tests',
    summary: 'Standard-library unittest suite verifying portfolio metadata, Study Buddy scheduling, and Campus Navigator shortest routes.',
    language: 'Python',
    countedByLinguist: true,
    defaultEnabled: false,
    content: `"""Unit tests for Bhoge Tejaswi portfolio generator and project modules."""

import unittest

from generate_portfolio import build_summary_report, load_portfolio_data
from projects.ai_study_buddy import create_default_plan
from projects.campus_navigator import build_sample_campus


class TestPortfolioProjectModules(unittest.TestCase):
    def test_portfolio_data_loads(self) -> None:
        data = load_portfolio_data()
        self.assertEqual(data["owner"]["email"], "tejaswibhoge@gmail.com")
        report = build_summary_report(data)
        self.assertIn("Bhoge Tejaswi", report)

    def test_study_buddy_recommendations(self) -> None:
        plan = create_default_plan()
        self.assertGreater(plan.completion_rate(), 0.0)
        sessions = plan.next_recommended_sessions(max_minutes=80)
        self.assertTrue(len(sessions) >= 1)

    def test_campus_navigator_shortest_path(self) -> None:
        campus = build_sample_campus()
        route = campus.shortest_route("Main Gate", "Programming Lab")
        self.assertEqual(route.total_meters, 245)
        self.assertEqual(route.stops[0], "Main Gate")
        self.assertEqual(route.stops[-1], "Programming Lab")


if __name__ == "__main__":
    unittest.main()
`,
  },
  {
    id: 'portfolio_data',
    path: 'portfolio_data.json',
    title: 'Structured Portfolio Data (JSON)',
    summary: 'Clean data source read by generate_portfolio.py containing your skills, projects, and Wolfram U certificates.',
    language: 'JSON',
    countedByLinguist: false,
    defaultEnabled: true,
    content: `{
  "owner": {
    "name": "Bhoge Tejaswi",
    "location": "India",
    "degree": "Computer Science & Engineering",
    "email": "tejaswibhoge@gmail.com"
  },
  "skills": [
    {
      "symbol": "⌘",
      "title": "Programming",
      "description": "Building a foundation in programming logic and problem-solving.",
      "items": ["Python", "Java", "Basics of C"]
    },
    {
      "symbol": "◇",
      "title": "Web technologies",
      "description": "Exploring how to create clean, accessible and responsive websites.",
      "items": ["HTML", "CSS", "JavaScript"]
    },
    {
      "symbol": "✳",
      "title": "Core concepts",
      "description": "Strengthening analytical thinking and computer science fundamentals.",
      "items": ["Discrete Mathematics", "Problem Solving"]
    }
  ],
  "projects": [
    {
      "id": "01",
      "title": "Smart Campus Navigator",
      "module": "projects/campus_navigator.py",
      "tags": ["Python", "HTML", "CSS", "JavaScript"]
    },
    {
      "id": "02",
      "title": "AI Study Buddy",
      "module": "projects/ai_study_buddy.py",
      "tags": ["Python", "UI Design", "AI Concept"]
    }
  ],
  "certificates": [
    {
      "issuer": "WOLFRAM U • LEVEL 1",
      "title": "Discrete Mathematics",
      "details": "Level 1 Certificate · November 2026 · 4 Training Hours",
      "file": "wolfram-level-1-discrete-mathematics.pdf"
    },
    {
      "issuer": "WOLFRAM U • COMPLETION",
      "title": "Introduction to Discrete Mathematics",
      "details": "Completion Certificate · November 2026 · 4 Training Hours",
      "file": "introduction-to-discrete-mathematics.pdf"
    }
  ]
}
`,
  },
  {
    id: 'requirements',
    path: 'requirements.txt',
    title: 'Python Environment Spec',
    summary: 'Documents Python 3.10+ standard-library compatibility with zero third-party packages required.',
    language: 'Text',
    countedByLinguist: false,
    defaultEnabled: true,
    content: `# Zero external dependencies required — uses Python 3.10+ standard library.\n# Run: python3 generate_portfolio.py\n`,
  },
];

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
