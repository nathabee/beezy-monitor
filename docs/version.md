# Version History — Beezy Monitor

This document tracks functional and architectural changes of
**Beezy Monitor**.

Conventions:

* Versions are listed with the **newest at the top**
* Use:

  * `##` for **major** versions
  * `###` for **minor** versions
  * `####` for **patch** versions
* Entries are concise and factual

---

## **MAJOR v0**

### **v0.x — Focus: Foundation and functional MVP**

* Early development phase
* Architecture definition and validation
* Core monitoring concepts implemented
* Internal testing via unpacked extension

---

#### **v0.0.1 — Epic: Initial monitoring prototype**

* Chrome DevTools extension (Manifest V3) bootstrapped
* Panel-based UI with Overview, Settings, and Logs tabs
* Explicit Start / Stop monitoring control
* Live sampling via inspected page evaluation
* DOM node count with baseline and delta
* Resource rate approximation using Performance API
* JavaScript error counting via injected console hook
* Long task counting via PerformanceObserver
* Canvas-based charts (main + mini trends)
* Structured logging:

  * Console trace (developer)
  * Debug trace (persisted)
  * Action / audit log (user-visible)

---