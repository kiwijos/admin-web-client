<script lang="ts">
import {page} from '$app/stores';

</script>

{#if $page.data.user}
    <h1>Dashboard</h1>
    <p>Welcome back, <span class="font-bold text-primary-500">{$page.data.user.email}</span></p>
    <p>Only authenticated users can see this page.</p>
    <form action="/logout" method="POST">
        <button type="submit" class="btn variant-filled">Log out</button>
    </form>
{:else}
    <h1>Access denied</h1>
    <p>You must be <a class="anchor" href="/login">logged in</a> to see this page.</p>
{/if}